#!/usr/bin/env python3
"""Supervised, default-disabled B2A notification-only delivery.

This module intentionally does not alter the B1 dry-run CLI.  A real queue
submission requires both an explicit command-line opt-in and an enabled,
user-local configuration.  Tests inject queue runners; development and QA do
not invoke the real Codex queue command.
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import getpass
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tempfile
from typing import Any, Callable, Mapping
import uuid

import dispatch_inbox


SCHEMA_VERSION = 2
TEMPLATE_VERSION = 1
ALLOWED_REPOSITORY = dispatch_inbox.ALLOWED_REPOSITORY
ALLOWED_AUTHOR = dispatch_inbox.ALLOWED_AUTHOR
APPROVAL_LABEL = dispatch_inbox.APPROVAL_LABEL
NOTIFY_LABEL = "dispatch:notify"
CANCELLED_LABEL = "dispatch:cancelled"
ALLOWED_MODES = frozenset({"probe", "notify"})
ALLOWED_MODULES = frozenset({"007", "008", "dispatch-b2a"})
MAX_BODY_BYTES = 100_000
MAX_STATE_ENTRIES = 500
MAX_QUEUE_OUTPUT_BYTES = 64_000
SUPPRESSING_STATES = frozenset(
    {
        "PREPARED",
        "QUEUE_SUBMITTED",
        "UNKNOWN_DELIVERY",
        "ACK_REPORTED",
        "ACK_VERIFIED",
        "COMPLETE",
    }
)
ISSUE_FIELDS = frozenset(
    {
        "schema_version",
        "dispatch_id",
        "mode",
        "module",
        "repo",
        "notification_record_path",
        "notification_record_sha",
        "handoff_path",
        "handoff_blob_sha",
        "created_by",
        "expires_at",
        "requires_human_approval",
    }
)
RECORD_FIELDS = frozenset(
    {
        "schema_version",
        "dispatch_id",
        "mode",
        "module",
        "repo",
        "issue_number",
        "notification_authorized",
        "authorization_scope",
        "handoff_path",
        "handoff_blob_sha",
        "notification_template_version",
        "expires_at",
        "nonce",
        "created_by",
    }
)
ISSUE_FIELD_TYPES: dict[str, type[Any]] = {
    "schema_version": int,
    "dispatch_id": str,
    "mode": str,
    "module": str,
    "repo": str,
    "notification_record_path": str,
    "notification_record_sha": str,
    "handoff_path": str,
    "handoff_blob_sha": str,
    "created_by": str,
    "expires_at": str,
    "requires_human_approval": bool,
}
RECORD_FIELD_TYPES: dict[str, type[Any]] = {
    "schema_version": int,
    "dispatch_id": str,
    "mode": str,
    "module": str,
    "repo": str,
    "issue_number": int,
    "notification_authorized": bool,
    "authorization_scope": str,
    "handoff_path": str,
    "handoff_blob_sha": str,
    "notification_template_version": int,
    "expires_at": str,
    "nonce": str,
    "created_by": str,
}
CONFIG_FIELDS = frozenset(
    {
        "version",
        "dispatch_enabled",
        "notification_only",
        "repository",
        "expected_author",
        "expected_user",
        "thread_uuid",
        "codex_executable",
    }
)
ISSUE_FENCE_RE = re.compile(r"```dispatch\s*\n(?P<body>.*?)\n```", re.DOTALL)
RECORD_FENCE_RE = re.compile(
    r"```notification-authorization\s*\n(?P<body>.*?)\n```", re.DOTALL
)
NONCE_RE = re.compile(r"^[A-Z0-9][A-Z0-9_-]{15,63}$")


class B2Error(RuntimeError):
    def __init__(self, code: str, detail: str = ""):
        super().__init__(detail or code)
        self.code = code


class StateError(B2Error):
    pass


class QueueError(B2Error):
    pass


@dataclasses.dataclass(frozen=True)
class NotifyResult:
    status: str
    reason_code: str
    issue_number: int | None = None
    dispatch_id: str | None = None
    authorization_blob_sha: str | None = None

    def as_public_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)


@dataclasses.dataclass(frozen=True)
class AuthorizedNotification:
    issue_number: int
    dispatch_id: str
    mode: str
    module: str
    notification_record_path: str
    notification_record_sha: str
    handoff_path: str
    handoff_blob_sha: str
    expires_at: dt.datetime
    nonce: str

    @property
    def dedupe_key(self) -> str:
        raw = (
            f"{ALLOWED_REPOSITORY}\0{self.issue_number}\0{self.dispatch_id}"
            f"\0{self.notification_record_sha}"
        )
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @property
    def expected_ack(self) -> str:
        return f"PWS-B2-ACK {self.dispatch_id} {self.nonce}"


@dataclasses.dataclass(frozen=True)
class LocalConfig:
    dispatch_enabled: bool
    notification_only: bool
    repository: str
    expected_author: str
    expected_user: str
    thread_uuid: str
    codex_executable: Path

    @classmethod
    def load(cls, path: Path) -> "LocalConfig":
        if path.is_symlink():
            raise B2Error("CONFIG_UNSAFE")
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise B2Error("CONFIG_MISSING") from exc
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise B2Error("CONFIG_INVALID") from exc
        if (
            type(raw) is not dict
            or set(raw) != CONFIG_FIELDS
            or type(raw.get("version")) is not int
            or raw.get("version") != 1
        ):
            raise B2Error("CONFIG_INVALID")
        executable = raw.get("codex_executable")
        values = {
            "dispatch_enabled": raw.get("dispatch_enabled"),
            "notification_only": raw.get("notification_only"),
            "repository": raw.get("repository"),
            "expected_author": raw.get("expected_author"),
            "expected_user": raw.get("expected_user"),
            "thread_uuid": raw.get("thread_uuid"),
        }
        if type(executable) is not str or not all(
            type(value) is expected
            for value, expected in (
                (values["dispatch_enabled"], bool),
                (values["notification_only"], bool),
                (values["repository"], str),
                (values["expected_author"], str),
                (values["expected_user"], str),
                (values["thread_uuid"], str),
            )
        ):
            raise B2Error("CONFIG_INVALID")
        return cls(codex_executable=Path(executable), **values)  # type: ignore[arg-type]

    def validate_runtime(self, *, current_user: str | None = None) -> None:
        if not self.dispatch_enabled:
            raise B2Error("DELIVERY_DISABLED")
        if not self.notification_only:
            raise B2Error("NOTIFICATION_ONLY_REQUIRED")
        if self.repository != ALLOWED_REPOSITORY or self.expected_author != ALLOWED_AUTHOR:
            raise B2Error("CONFIG_IDENTITY_MISMATCH")
        if self.expected_user != (current_user or getpass.getuser()):
            raise B2Error("LOCAL_USER_MISMATCH")
        try:
            parsed_uuid = uuid.UUID(self.thread_uuid)
        except (ValueError, AttributeError) as exc:
            raise B2Error("THREAD_UUID_INVALID") from exc
        if str(parsed_uuid) != self.thread_uuid.lower():
            raise B2Error("THREAD_UUID_INVALID")
        path = self.codex_executable
        try:
            has_redirected_parent = path.resolve(strict=True) != path.absolute()
        except OSError as exc:
            raise B2Error("CODEX_EXECUTABLE_INVALID") from exc
        if (
            not path.is_absolute()
            or path.name.casefold() not in {"codex", "codex.exe"}
            or path.is_symlink()
            or has_redirected_parent
            or not path.is_file()
        ):
            raise B2Error("CODEX_EXECUTABLE_INVALID")


def default_local_dir() -> Path:
    base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    return base / "PersonalWorkspace" / "dispatch-inbox"


def _json_fence(body: Any, pattern: re.Pattern[str], expected: frozenset[str]) -> dict[str, Any]:
    if type(body) is not str or len(body.encode("utf-8")) > MAX_BODY_BYTES:
        raise B2Error("BODY_INVALID")
    matches = list(pattern.finditer(body))
    if len(matches) != 1:
        raise B2Error("ENVELOPE_MISSING_OR_MULTIPLE")

    def strict_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise B2Error("DUPLICATE_FIELDS")
            result[key] = value
        return result

    def reject_constant(_: str) -> None:
        raise B2Error("ENVELOPE_MALFORMED")

    try:
        value = json.loads(
            matches[0].group("body"),
            object_pairs_hook=strict_object,
            parse_constant=reject_constant,
        )
    except B2Error:
        raise
    except (json.JSONDecodeError, UnicodeError) as exc:
        raise B2Error("ENVELOPE_MALFORMED") from exc
    if type(value) is not dict or set(value) != expected:
        raise B2Error("SCHEMA_FIELDS_MISMATCH")
    return value


def _expiry(raw: Any) -> dt.datetime:
    if type(raw) is not str or len(raw) > 40:
        raise B2Error("EXPIRY_INVALID")
    try:
        value = dt.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise B2Error("EXPIRY_INVALID") from exc
    if value.tzinfo is None:
        raise B2Error("EXPIRY_INVALID")
    return value.astimezone(dt.timezone.utc)


def _safe_path(raw: Any, *, record: bool) -> str:
    path = dispatch_inbox._safe_handoff_path(raw)
    if path is None:
        raise B2Error("PATH_UNSAFE")
    parts = PurePosixPath(path).parts
    if record and (len(parts) < 4 or parts[:3] != ("docs", "dispatch", "notifications")):
        raise B2Error("NOTIFICATION_RECORD_PATH_INVALID")
    return path


def _labels(issue: Mapping[str, Any]) -> set[str]:
    labels = issue.get("labels")
    if type(labels) is not list:
        raise B2Error("ISSUE_LABELS_INVALID")
    result: set[str] = set()
    for label in labels:
        if type(label) is str:
            result.add(label)
        elif type(label) is dict and type(label.get("name")) is str:
            result.add(label["name"])
        else:
            raise B2Error("ISSUE_LABELS_INVALID")
    return result


def _validate_field_types(
    value: Mapping[str, Any], expected: Mapping[str, type[Any]], reason_code: str
) -> None:
    for field, expected_type in expected.items():
        if type(value[field]) is not expected_type:
            raise B2Error(reason_code)


def _validate_issue_identity(issue: Mapping[str, Any]) -> int:
    number = issue.get("number")
    if type(number) is not int or number <= 0:
        raise B2Error("ISSUE_NUMBER_INVALID")
    repository = issue.get("repository_full_name")
    if type(repository) is not str or repository != ALLOWED_REPOSITORY:
        raise B2Error("REPOSITORY_NOT_ALLOWED")
    state = issue.get("state")
    if type(state) is not str or state != "open":
        raise B2Error("ISSUE_NOT_OPEN")
    user = issue.get("user")
    if type(user) is not dict or type(user.get("login")) is not str:
        raise B2Error("AUTHOR_NOT_ALLOWED")
    if user["login"] != ALLOWED_AUTHOR:
        raise B2Error("AUTHOR_NOT_ALLOWED")
    labels = _labels(issue)
    if CANCELLED_LABEL in labels:
        raise B2Error("NOTIFICATION_CANCELLED")
    if APPROVAL_LABEL not in labels:
        raise B2Error("APPROVAL_LABEL_MISSING")
    return number


def validate_notification(
    issue: Mapping[str, Any],
    fetch_file: Callable[[str], dispatch_inbox.FileSnapshot],
    *,
    now: dt.datetime | None = None,
) -> tuple[AuthorizedNotification | None, NotifyResult]:
    current = (now or dt.datetime.now(dt.timezone.utc)).astimezone(dt.timezone.utc)
    number = issue.get("number") if type(issue.get("number")) is int else None
    dispatch_id: str | None = None
    try:
        issue_number = _validate_issue_identity(issue)
        envelope = _json_fence(issue.get("body"), ISSUE_FENCE_RE, ISSUE_FIELDS)
        _validate_field_types(envelope, ISSUE_FIELD_TYPES, "ISSUE_FIELD_TYPE_MISMATCH")
        dispatch_id = envelope["dispatch_id"]
        if envelope.get("schema_version") != SCHEMA_VERSION:
            raise B2Error("SCHEMA_VERSION_UNSUPPORTED")
        if not dispatch_inbox.DISPATCH_ID_RE.fullmatch(dispatch_id):
            raise B2Error("DISPATCH_ID_INVALID")
        mode = envelope.get("mode")
        if mode == "implement":
            raise B2Error("IMPLEMENT_MODE_FORBIDDEN")
        if mode not in ALLOWED_MODES:
            raise B2Error("MODE_NOT_ALLOWED")
        module = envelope.get("module")
        if module not in ALLOWED_MODULES:
            raise B2Error("MODULE_NOT_ALLOWED")
        if envelope.get("repo") != ALLOWED_REPOSITORY or envelope.get("created_by") != ALLOWED_AUTHOR:
            raise B2Error("ENVELOPE_IDENTITY_MISMATCH")
        if envelope["requires_human_approval"] is not False:
            raise B2Error("UNSUPPORTED_APPROVAL_MODE")
        record_path = _safe_path(envelope.get("notification_record_path"), record=True)
        handoff_path = _safe_path(envelope.get("handoff_path"), record=False)
        if record_path != f"docs/dispatch/notifications/{dispatch_id}.md":
            raise B2Error("NOTIFICATION_RECORD_PATH_MISMATCH")
        handoff_parts = PurePosixPath(handoff_path).parts
        if module in {"007", "008"} and handoff_parts[:3] != ("docs", "handoffs", module):
            raise B2Error("HANDOFF_MODULE_MISMATCH")
        if module == "dispatch-b2a" and handoff_parts[:2] != ("docs", "dispatch"):
            raise B2Error("HANDOFF_MODULE_MISMATCH")
        record_sha = envelope.get("notification_record_sha")
        handoff_sha = envelope.get("handoff_blob_sha")
        if not isinstance(record_sha, str) or not dispatch_inbox.SHA_RE.fullmatch(record_sha):
            raise B2Error("NOTIFICATION_RECORD_SHA_INVALID")
        if not isinstance(handoff_sha, str) or not dispatch_inbox.SHA_RE.fullmatch(handoff_sha):
            raise B2Error("HANDOFF_SHA_INVALID")
        expires_at = _expiry(envelope.get("expires_at"))
        if expires_at <= current:
            raise B2Error("NOTIFICATION_EXPIRED")

        record_snapshot = fetch_file(record_path)
        if (
            record_snapshot.path != record_path
            or record_snapshot.ref != dispatch_inbox.AUTHORITATIVE_REF
            or record_snapshot.blob_sha != record_sha
        ):
            raise B2Error("NOTIFICATION_RECORD_SHA_MISMATCH")
        record = _json_fence(record_snapshot.content, RECORD_FENCE_RE, RECORD_FIELDS)
        _validate_field_types(record, RECORD_FIELD_TYPES, "RECORD_FIELD_TYPE_MISMATCH")
        if record["notification_authorized"] is not True:
            raise B2Error("AUTHORIZATION_RECORD_MISMATCH")
        expected_record_values = {
            "schema_version": SCHEMA_VERSION,
            "dispatch_id": dispatch_id,
            "mode": mode,
            "module": module,
            "repo": ALLOWED_REPOSITORY,
            "issue_number": issue_number,
            "authorization_scope": "NOTIFICATION_ONLY",
            "handoff_path": handoff_path,
            "handoff_blob_sha": handoff_sha,
            "notification_template_version": TEMPLATE_VERSION,
            "expires_at": envelope.get("expires_at"),
            "created_by": ALLOWED_AUTHOR,
        }
        for key, expected in expected_record_values.items():
            if record.get(key) != expected:
                raise B2Error("AUTHORIZATION_RECORD_MISMATCH")
        nonce = record.get("nonce")
        if not isinstance(nonce, str) or not NONCE_RE.fullmatch(nonce):
            raise B2Error("NONCE_INVALID")
        if _expiry(record.get("expires_at")) <= current:
            raise B2Error("NOTIFICATION_EXPIRED")

        handoff_snapshot = fetch_file(handoff_path)
        if (
            handoff_snapshot.path != handoff_path
            or handoff_snapshot.ref != dispatch_inbox.AUTHORITATIVE_REF
            or handoff_snapshot.blob_sha != handoff_sha
        ):
            raise B2Error("HANDOFF_SHA_MISMATCH")

        authorized = AuthorizedNotification(
            issue_number=issue_number,
            dispatch_id=dispatch_id,
            mode=mode,
            module=module,
            notification_record_path=record_path,
            notification_record_sha=record_sha,
            handoff_path=handoff_path,
            handoff_blob_sha=handoff_sha,
            expires_at=expires_at,
            nonce=nonce,
        )
        return authorized, NotifyResult(
            "AUTHORIZED_NOTIFICATION",
            "NOTIFICATION_POLICY_VALIDATED",
            issue_number,
            dispatch_id,
            record_sha,
        )
    except B2Error as exc:
        return None, NotifyResult("REJECTED", exc.code, number, dispatch_id)
    except dispatch_inbox.AdapterUnavailable as exc:
        return None, NotifyResult("BLOCKED", exc.code, number, dispatch_id)


def compose_message(notification: AuthorizedNotification) -> str:
    message = (
        f"PWS-NOTIFICATION {notification.dispatch_id} {notification.nonce}\n"
        f"Source: {ALLOWED_REPOSITORY} Issue #{notification.issue_number}\n"
        "Mode: NOTIFICATION ONLY\n"
        f"Approved main-branch handoff: {notification.handoff_path}\n"
        f"Expected blob: {notification.handoff_blob_sha}\n"
        "Module implementation status: BLOCKED; notification does not authorize implementation.\n"
        "Action: verify the referenced GitHub handoff and reply exactly\n"
        f'"{notification.expected_ack}".\n'
        "Do not edit files, run Git writes, start Module 007/008, create PRs, or execute the handoff.\n"
        "Development instructions require a new, separately authorized B3 dispatch."
    )
    if len(message.encode("utf-8")) > 2_000:
        raise B2Error("MESSAGE_TOO_LARGE")
    return message


class OneInstanceLock:
    def __init__(self, path: Path):
        self.path = path
        self.descriptor: int | None = None

    def __enter__(self) -> "OneInstanceLock":
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            if self.path.parent.is_symlink() or self.path.is_symlink():
                raise StateError("LOCK_PATH_UNSAFE")
            self.descriptor = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            os.write(self.descriptor, str(os.getpid()).encode("ascii"))
            os.fsync(self.descriptor)
        except FileExistsError as exc:
            raise StateError("ANOTHER_INSTANCE_ACTIVE") from exc
        except OSError as exc:
            if self.descriptor is not None:
                os.close(self.descriptor)
                self.descriptor = None
            raise StateError("LOCK_UNAVAILABLE") from exc
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> None:
        if self.descriptor is not None:
            os.close(self.descriptor)
            self.descriptor = None
        try:
            self.path.unlink(missing_ok=True)
        except OSError:
            pass


class OutboxStore:
    def __init__(self, path: Path):
        self.path = path

    def _load(self) -> dict[str, Any]:
        if not self.path.exists():
            return {"version": 1, "entries": {}}
        if self.path.is_symlink():
            raise StateError("STATE_PATH_UNSAFE")
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise StateError("STATE_CORRUPT") from exc
        if (
            not isinstance(data, dict)
            or data.get("version") != 1
            or not isinstance(data.get("entries"), dict)
            or len(data["entries"]) > MAX_STATE_ENTRIES
        ):
            raise StateError("STATE_CORRUPT")
        return data

    def _write(self, data: Mapping[str, Any]) -> None:
        temporary: str | None = None
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            if self.path.parent.is_symlink() or self.path.is_symlink():
                raise StateError("STATE_PATH_UNSAFE")
            os.chmod(self.path.parent, 0o700)
            descriptor, temporary = tempfile.mkstemp(
                prefix="b2-outbox-", suffix=".tmp", dir=self.path.parent
            )
            with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
                json.dump(data, handle, sort_keys=True, separators=(",", ":"))
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, self.path)
            temporary = None
        except StateError:
            raise
        except OSError as exc:
            raise StateError("STATE_PERSIST_FAILED") from exc
        finally:
            if temporary and os.path.exists(temporary):
                try:
                    os.unlink(temporary)
                except OSError:
                    pass

    def prepare(self, notification: AuthorizedNotification) -> tuple[dict[str, Any], bool]:
        data = self._load()
        entries: dict[str, Any] = data["entries"]
        key = notification.dedupe_key
        existing = entries.get(key)
        if existing is not None:
            if not isinstance(existing, dict) or existing.get("status") not in SUPPRESSING_STATES:
                raise StateError("STATE_CORRUPT")
            if existing.get("status") == "PREPARED":
                existing = dict(existing)
                existing["status"] = "UNKNOWN_DELIVERY"
                existing["reason_code"] = "PREPARED_RECOVERED_NO_RETRY"
                entries[key] = existing
                self._write(data)
            return existing, False
        if len(entries) >= MAX_STATE_ENTRIES:
            raise StateError("STATE_CAPACITY_REACHED")
        entry = {
            "status": "PREPARED",
            "reason_code": "DURABLE_INTENT_RECORDED",
            "repository": ALLOWED_REPOSITORY,
            "issue_number": notification.issue_number,
            "dispatch_id": notification.dispatch_id,
            "authorization_blob_sha": notification.notification_record_sha,
            "expected_ack_sha256": hashlib.sha256(
                notification.expected_ack.encode("utf-8")
            ).hexdigest(),
            "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        entries[key] = entry
        self._write(data)
        return entry, True

    def transition(self, key: str, status: str, reason_code: str) -> None:
        if status not in SUPPRESSING_STATES:
            raise StateError("STATE_TRANSITION_INVALID")
        if status == "ACK_VERIFIED":
            raise StateError("ACK_VERIFICATION_SOURCE_UNAVAILABLE")
        data = self._load()
        entry = data["entries"].get(key)
        if not isinstance(entry, dict) or entry.get("status") not in SUPPRESSING_STATES:
            raise StateError("STATE_ENTRY_MISSING")
        updated = dict(entry)
        updated["status"] = status
        updated["reason_code"] = reason_code
        updated["updated_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
        data["entries"][key] = updated
        self._write(data)

    def record_ack_reported(self, notification: AuthorizedNotification, observed: str) -> bool:
        if observed != notification.expected_ack:
            return False
        data = self._load()
        entry = data["entries"].get(notification.dedupe_key)
        if not isinstance(entry, dict) or entry.get("status") != "QUEUE_SUBMITTED":
            return False
        expected_hash = hashlib.sha256(observed.encode("utf-8")).hexdigest()
        if entry.get("expected_ack_sha256") != expected_hash:
            return False
        self.transition(notification.dedupe_key, "ACK_REPORTED", "OPERATOR_ACK_REPORTED")
        return True


Runner = Callable[..., subprocess.CompletedProcess[bytes]]


class CodexQueueSender:
    def __init__(
        self,
        *,
        runner: Runner = subprocess.run,
        timeout_seconds: int = 15,
    ) -> None:
        self.runner = runner
        self.timeout_seconds = min(max(timeout_seconds, 1), 30)

    def submit(self, config: LocalConfig, message: str) -> None:
        command = [
            str(config.codex_executable),
            "queue",
            "--thread",
            config.thread_uuid,
            "--message",
            message,
        ]
        try:
            completed = self.runner(
                command,
                check=False,
                capture_output=True,
                text=False,
                timeout=self.timeout_seconds,
                shell=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise QueueError("QUEUE_TIMEOUT") from exc
        except (OSError, UnicodeError) as exc:
            raise QueueError("QUEUE_UNAVAILABLE") from exc
        returncode = getattr(completed, "returncode", None)
        if not isinstance(returncode, int):
            raise QueueError("QUEUE_RESULT_INVALID")
        for value in (getattr(completed, "stdout", None), getattr(completed, "stderr", None)):
            if value is not None and not isinstance(value, (bytes, str)):
                raise QueueError("QUEUE_RESULT_INVALID")
            if isinstance(value, bytes) and len(value) > MAX_QUEUE_OUTPUT_BYTES:
                raise QueueError("QUEUE_OUTPUT_TOO_LARGE")
            if isinstance(value, str) and len(value.encode("utf-8", errors="replace")) > MAX_QUEUE_OUTPUT_BYTES:
                raise QueueError("QUEUE_OUTPUT_TOO_LARGE")
        if returncode != 0:
            stderr = getattr(completed, "stderr", b"")
            if isinstance(stderr, bytes):
                diagnostic = stderr[:MAX_QUEUE_OUTPUT_BYTES].decode("utf-8", errors="replace").casefold()
            elif isinstance(stderr, str):
                diagnostic = stderr[:MAX_QUEUE_OUTPUT_BYTES].casefold()
            else:
                diagnostic = ""
            code = (
                "SESSION_UNAVAILABLE"
                if any(term in diagnostic for term in ("thread not found", "session unavailable", "not loaded"))
                else "QUEUE_FAILED"
            )
            raise QueueError(code)


def attempt_notification(
    notification: AuthorizedNotification,
    config: LocalConfig,
    store: OutboxStore,
    lock: OneInstanceLock,
    sender: CodexQueueSender,
    *,
    current_user: str | None = None,
    now: dt.datetime | None = None,
) -> NotifyResult:
    try:
        config.validate_runtime(current_user=current_user)
        current = (now or dt.datetime.now(dt.timezone.utc)).astimezone(dt.timezone.utc)
        if notification.expires_at <= current:
            raise B2Error("NOTIFICATION_EXPIRED")
        message = compose_message(notification)
        with lock:
            entry, created = store.prepare(notification)
            if not created:
                return NotifyResult(
                    entry["status"],
                    "DUPLICATE_SUPPRESSED",
                    notification.issue_number,
                    notification.dispatch_id,
                    notification.notification_record_sha,
                )
            try:
                sender.submit(config, message)
            except QueueError as exc:
                try:
                    store.transition(notification.dedupe_key, "UNKNOWN_DELIVERY", exc.code)
                except StateError:
                    pass
                return NotifyResult(
                    "UNKNOWN_DELIVERY",
                    exc.code,
                    notification.issue_number,
                    notification.dispatch_id,
                    notification.notification_record_sha,
                )
            try:
                store.transition(
                    notification.dedupe_key, "QUEUE_SUBMITTED", "QUEUE_EXIT_ZERO"
                )
            except StateError:
                return NotifyResult(
                    "UNKNOWN_DELIVERY",
                    "STATE_COMMIT_FAILED_AFTER_QUEUE",
                    notification.issue_number,
                    notification.dispatch_id,
                    notification.notification_record_sha,
                )
            return NotifyResult(
                "QUEUE_SUBMITTED",
                "QUEUE_EXIT_ZERO_NOT_ACK",
                notification.issue_number,
                notification.dispatch_id,
                notification.notification_record_sha,
            )
    except B2Error as exc:
        return NotifyResult(
            "BLOCKED",
            exc.code,
            notification.issue_number,
            notification.dispatch_id,
            notification.notification_record_sha,
        )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Supervised, default-disabled Personal Workspace B2A notification sender"
    )
    parser.add_argument("--notify-once", action="store_true", help="perform one foreground notification attempt")
    parser.add_argument(
        "--enable-notifications",
        action="store_true",
        help="explicit local consent for this single invocation",
    )
    return parser


def _print(result: NotifyResult) -> None:
    print(json.dumps(result.as_public_dict(), sort_keys=True))


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if not args.notify_once or not args.enable_notifications:
        _print(NotifyResult("BLOCKED", "EXPLICIT_NOTIFY_OPT_IN_REQUIRED"))
        return 64
    local_dir = default_local_dir()
    try:
        config = LocalConfig.load(local_dir / "b2-notify-config.json")
        config.validate_runtime()
        client = dispatch_inbox.GhApiClient()
        issues = client.list_open_issues()
        validations = [validate_notification(issue, client.fetch_file) for issue in issues]
        authorized = [item for item, _ in validations if item is not None]
        if len(authorized) != 1:
            reason = "NO_AUTHORIZED_NOTIFICATION" if not authorized else "MULTIPLE_AUTHORIZED_NOTIFICATIONS"
            _print(NotifyResult("BLOCKED", reason))
            return 2
        result = attempt_notification(
            authorized[0],
            config,
            OutboxStore(local_dir / "b2-outbox.json"),
            OneInstanceLock(local_dir / "b2-notify.lock"),
            CodexQueueSender(),
        )
        _print(result)
        return 0 if result.status in {"QUEUE_SUBMITTED", "ACK_REPORTED"} else 2
    except (B2Error, dispatch_inbox.AdapterUnavailable) as exc:
        _print(NotifyResult("BLOCKED", exc.code))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
