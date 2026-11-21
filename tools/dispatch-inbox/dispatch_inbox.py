#!/usr/bin/env python3
"""Read-only GitHub Issues dispatch inbox classifier for Personal Workspace B1."""

from __future__ import annotations

import argparse
import base64
import binascii
import dataclasses
import datetime as dt
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Any, Callable, Iterable, Mapping
from urllib.parse import quote


ALLOWED_REPOSITORY = "zyyu1/personal-workspace"
ALLOWED_AUTHOR = "zyyu1"
AUTHORITATIVE_REF = "main"
APPROVAL_LABEL = "dispatch:approved"
ALLOWED_MODES = frozenset({"probe", "notify", "implement"})
ALLOWED_GATE_STATES = frozenset({"READY", "PENDING", "BLOCKED"})
EXPECTED_FIELDS = frozenset(
    {
        "schema_version",
        "dispatch_id",
        "mode",
        "module",
        "repo",
        "handoff_path",
        "handoff_blob_sha",
        "created_by",
        "expires_at",
        "requires_human_approval",
        "gate_status",
    }
)
CLASSIFICATIONS = frozenset(
    {"ELIGIBLE_DRY_RUN", "BLOCKED_GATE", "REJECTED_UNTRUSTED", "UNAVAILABLE"}
)
DISPATCH_ID_RE = re.compile(r"^[A-Z0-9][A-Z0-9._-]{5,63}$")
MODULE_RE = re.compile(r"^(?:[0-9]{3}|dispatch-b1)$")
SHA_RE = re.compile(r"^[0-9a-f]{40}$")
FENCE_RE = re.compile(r"```dispatch\s*\n(?P<body>.*?)\n```", re.DOTALL)
MAX_RESPONSE_BYTES = 1_000_000
MAX_FILE_BYTES = 500_000
MAX_RECEIPTS = 500
A01_BASELINE_SHA = "dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237"
FIELD_KEY_RE = r"[A-Za-z][A-Za-z0-9 _-]{0,63}"
BOLD_FIELD_RE = re.compile(rf"^(?:- )?\*\*(?P<key>{FIELD_KEY_RE}):\*\* (?P<value>\S.*?)\s*$")
PLAIN_FIELD_RE = re.compile(rf"^(?:- )?(?P<key>{FIELD_KEY_RE}): (?P<value>\S.*?)\s*$")


class AdapterUnavailable(RuntimeError):
    def __init__(self, code: str, detail: str):
        super().__init__(detail)
        self.code = code
        self.detail = detail


@dataclasses.dataclass(frozen=True)
class FileSnapshot:
    path: str
    blob_sha: str
    content: str
    ref: str = AUTHORITATIVE_REF


@dataclasses.dataclass(frozen=True)
class Classification:
    issue_number: int | None
    dispatch_id: str | None
    classification: str
    reason_code: str
    repository: str = ALLOWED_REPOSITORY
    authoritative_blob_sha: str | None = None
    duplicate: bool = False

    def __post_init__(self) -> None:
        if self.classification not in CLASSIFICATIONS:
            raise ValueError("invalid classification")

    def as_public_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)


def _reject(issue_number: int | None, reason: str, dispatch_id: str | None = None) -> Classification:
    return Classification(issue_number, dispatch_id, "REJECTED_UNTRUSTED", reason)


def _block(
    issue_number: int | None,
    dispatch_id: str,
    reason: str,
    blob_sha: str | None = None,
) -> Classification:
    return Classification(issue_number, dispatch_id, "BLOCKED_GATE", reason, authoritative_blob_sha=blob_sha)


def parse_dispatch_envelope(body: Any) -> tuple[dict[str, Any] | None, str | None]:
    if not isinstance(body, str) or len(body.encode("utf-8")) > 100_000:
        return None, "BODY_INVALID"
    matches = list(FENCE_RE.finditer(body))
    if len(matches) != 1:
        return None, "ENVELOPE_MISSING_OR_MULTIPLE"
    try:
        value = json.loads(matches[0].group("body"))
    except (json.JSONDecodeError, UnicodeError):
        return None, "ENVELOPE_MALFORMED"
    if not isinstance(value, dict):
        return None, "ENVELOPE_NOT_OBJECT"
    if set(value) != EXPECTED_FIELDS:
        return None, "SCHEMA_FIELDS_MISMATCH"
    return value, None


def _safe_handoff_path(raw: Any) -> str | None:
    if not isinstance(raw, str) or not raw or len(raw) > 240:
        return None
    if "\\" in raw or "://" in raw or any(ord(char) < 32 for char in raw):
        return None
    path = PurePosixPath(raw)
    if path.is_absolute() or ".." in path.parts or path.suffix.lower() != ".md":
        return None
    if len(path.parts) < 3 or path.parts[0] != "docs" or path.parts[1] not in {"handoffs", "dispatch"}:
        return None
    return path.as_posix()


def _parse_expiry(raw: Any, now: dt.datetime) -> bool:
    if not isinstance(raw, str) or len(raw) > 40:
        return False
    try:
        expiry = dt.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return False
    if expiry.tzinfo is None:
        return False
    return expiry.astimezone(dt.timezone.utc) > now.astimezone(dt.timezone.utc)


def _label_names(issue: Mapping[str, Any]) -> set[str]:
    labels = issue.get("labels", [])
    if not isinstance(labels, list):
        return set()
    result: set[str] = set()
    for label in labels:
        if isinstance(label, str):
            result.add(label)
        elif isinstance(label, Mapping) and isinstance(label.get("name"), str):
            result.add(label["name"])
    return result


def _author_login(issue: Mapping[str, Any]) -> str | None:
    user = issue.get("user")
    return user.get("login") if isinstance(user, Mapping) and isinstance(user.get("login"), str) else None


def _canonical_fields(content: str) -> tuple[dict[str, str] | None, str | None]:
    fields: dict[str, str] = {}
    normalized_keys: set[str] = set()
    for line in content.splitlines():
        match = BOLD_FIELD_RE.fullmatch(line) or PLAIN_FIELD_RE.fullmatch(line)
        if not match:
            continue
        key = match.group("key")
        folded = key.casefold()
        if folded in normalized_keys:
            return None, "AUTHORIZATION_FIELDS_DUPLICATE"
        value = match.group("value").strip()
        if len(value) >= 2 and value.startswith("`") and value.endswith("`") and "`" not in value[1:-1]:
            value = value[1:-1]
        normalized_keys.add(folded)
        fields[key] = value
    return fields, None


def _authorization_reason(path: str, content: str, module: str, mode: str) -> str | None:
    fields, error = _canonical_fields(content)
    if error or fields is None:
        return error or "AUTHORIZATION_RECORD_INVALID"
    negative_state = re.compile(
        r"^(?:UNAUTHORIZED|NOT AUTHORIZED|DRAFT|PENDING|NOT STARTED|BLOCKED|"
        r"CONDITIONAL, NOT YET ACTIVE|APPROVED\?|APPROVED WITH CONDITIONS)(?:\b|\s|—|$)"
    )
    for key in {
        "Status",
        "Approval",
        "Authorization",
        "Implementation",
        "Implementation Authorization",
        "Design Window Authorization",
    }:
        value = fields.get(key)
        if isinstance(value, str) and negative_state.match(value):
            return "AUTHORIZATION_NEGATIVE_OR_CONDITIONAL"
    if module == "dispatch-b1":
        if path != "docs/dispatch/B1_EXECUTION_INSTRUCTION.md":
            return "AUTHORIZATION_PATH_MISMATCH"
        status = fields.get("Status")
        if not isinstance(status, str) or not re.fullmatch(
            r"IMPLEMENTATION APPROVED FOR B1 ONLY(?: — \d{4}-\d{2}-\d{2})?", status
        ):
            return "AUTHORIZATION_STATE_NOT_APPROVED"
        if fields.get("Owner") != "Windows Codex Development Window":
            return "AUTHORIZATION_OWNER_MISMATCH"
        if fields.get("Repository") not in {
            ALLOWED_REPOSITORY,
            f"`{ALLOWED_REPOSITORY}` (PRIVATE)",
        }:
            return "AUTHORIZATION_REPOSITORY_MISMATCH"
        return None

    if fields.get("Module") != module:
        return "AUTHORIZATION_MODULE_MISMATCH"
    if mode == "implement":
        if fields.get("Status") != "IMPLEMENTATION AUTHORIZED":
            return "AUTHORIZATION_STATE_NOT_APPROVED"
        if fields.get("Implementation Authorization") != "ACTIVE":
            return "IMPLEMENTATION_AUTHORIZATION_INACTIVE"
        return None
    if fields.get("Design") != "APPROVED":
        return "DESIGN_AUTHORIZATION_MISSING"
    return None


FileFetcher = Callable[[str], FileSnapshot]
CommitVerifier = Callable[[str], bool]


def classify_issue(
    issue: Mapping[str, Any],
    fetch_file: FileFetcher,
    *,
    now: dt.datetime | None = None,
    verify_commit: CommitVerifier | None = None,
) -> Classification:
    now = now or dt.datetime.now(dt.timezone.utc)
    number = issue.get("number") if isinstance(issue.get("number"), int) else None
    if issue.get("repository_full_name", ALLOWED_REPOSITORY) != ALLOWED_REPOSITORY:
        return _reject(number, "REPOSITORY_NOT_ALLOWED")
    if issue.get("state") != "open":
        return _reject(number, "ISSUE_NOT_OPEN")
    if _author_login(issue) != ALLOWED_AUTHOR:
        return _reject(number, "AUTHOR_NOT_ALLOWED")
    if APPROVAL_LABEL not in _label_names(issue):
        return _reject(number, "APPROVAL_LABEL_MISSING")

    envelope, error = parse_dispatch_envelope(issue.get("body"))
    if error or envelope is None:
        return _reject(number, error or "ENVELOPE_INVALID")
    dispatch_id = envelope.get("dispatch_id") if isinstance(envelope.get("dispatch_id"), str) else None

    if envelope["schema_version"] != 1:
        return _reject(number, "SCHEMA_VERSION_UNSUPPORTED", dispatch_id)
    if not isinstance(dispatch_id, str) or not DISPATCH_ID_RE.fullmatch(dispatch_id):
        return _reject(number, "DISPATCH_ID_INVALID")
    if envelope["mode"] not in ALLOWED_MODES:
        return _reject(number, "MODE_NOT_ALLOWED", dispatch_id)
    if not isinstance(envelope["module"], str) or not MODULE_RE.fullmatch(envelope["module"]):
        return _reject(number, "MODULE_INVALID", dispatch_id)
    if envelope["repo"] != ALLOWED_REPOSITORY:
        return _reject(number, "REPOSITORY_NOT_ALLOWED", dispatch_id)
    if envelope["created_by"] != ALLOWED_AUTHOR:
        return _reject(number, "CREATOR_NOT_ALLOWED", dispatch_id)
    if envelope["gate_status"] not in ALLOWED_GATE_STATES:
        return _reject(number, "GATE_STATUS_INVALID", dispatch_id)
    if not isinstance(envelope["requires_human_approval"], bool):
        return _reject(number, "HUMAN_APPROVAL_FLAG_INVALID", dispatch_id)
    if envelope["mode"] == "implement" and envelope["requires_human_approval"] is not True:
        return _reject(number, "HUMAN_APPROVAL_REQUIRED", dispatch_id)
    if not _parse_expiry(envelope["expires_at"], now):
        return _reject(number, "REQUEST_EXPIRED_OR_INVALID", dispatch_id)

    path = _safe_handoff_path(envelope["handoff_path"])
    if path is None:
        return _reject(number, "HANDOFF_PATH_UNSAFE", dispatch_id)
    expected_sha = envelope["handoff_blob_sha"]
    if not isinstance(expected_sha, str) or not SHA_RE.fullmatch(expected_sha):
        return _reject(number, "HANDOFF_SHA_INVALID", dispatch_id)

    try:
        handoff = fetch_file(path)
    except AdapterUnavailable as exc:
        return Classification(number, dispatch_id, "UNAVAILABLE", exc.code)
    if handoff.ref != AUTHORITATIVE_REF:
        return _reject(number, "AUTHORITATIVE_REF_MISMATCH", dispatch_id)
    if handoff.path != path or handoff.blob_sha != expected_sha:
        return _reject(number, "HANDOFF_BLOB_MISMATCH", dispatch_id)
    authorization_reason = _authorization_reason(
        handoff.path, handoff.content, envelope["module"], envelope["mode"]
    )
    if authorization_reason:
        return _block(number, dispatch_id, authorization_reason, handoff.blob_sha)

    if envelope["mode"] == "implement" and envelope["gate_status"] != "READY":
        return _block(number, dispatch_id, "DECLARED_GATE_NOT_READY", handoff.blob_sha)
    if envelope["mode"] == "implement" and envelope["module"] == "008":
        gate_reason, unavailable_code = _module_008_gate(fetch_file, verify_commit)
        if unavailable_code:
            return Classification(number, dispatch_id, "UNAVAILABLE", unavailable_code)
        if gate_reason:
            return _block(number, dispatch_id, gate_reason, handoff.blob_sha)

    return Classification(
        number,
        dispatch_id,
        "ELIGIBLE_DRY_RUN",
        "VALIDATED_DRY_RUN_ONLY",
        authoritative_blob_sha=handoff.blob_sha,
    )


def _required_gate_file(
    fetch_file: FileFetcher, path: str
) -> tuple[FileSnapshot | None, str | None, str | None]:
    try:
        snapshot = fetch_file(path)
    except AdapterUnavailable as exc:
        if exc.code in {"GH_NOT_FOUND", "FIXTURE_FILE_MISSING"}:
            return None, "GATE_EVIDENCE_MISSING", None
        return None, None, exc.code
    if snapshot.path != path or snapshot.ref != AUTHORITATIVE_REF:
        return None, "GATE_EVIDENCE_UNTRUSTED", None
    return snapshot, None, None


def _module_008_gate(
    fetch_file: FileFetcher, verify_commit: CommitVerifier | None
) -> tuple[str | None, str | None]:
    status_007, missing_reason, unavailable = _required_gate_file(
        fetch_file, "docs/handoffs/007/STATUS.md"
    )
    if unavailable:
        return None, unavailable
    if missing_reason or status_007 is None:
        return (
            "MODULE_007_STATUS_MISSING"
            if missing_reason == "GATE_EVIDENCE_MISSING"
            else "MODULE_007_STATUS_INVALID"
        ), None
    fields_007, error = _canonical_fields(status_007.content)
    if error or fields_007 is None:
        return "MODULE_007_STATUS_INVALID", None
    if fields_007.get("Module") != "007":
        return "MODULE_007_ID_MISMATCH", None
    if fields_007.get("Independent QA") != "ACCEPTED":
        return "MODULE_007_QA_NOT_ACCEPTED", None
    if fields_007.get("Implementation Acceptance") != "ACCEPTED":
        return "MODULE_007_IMPLEMENTATION_NOT_ACCEPTED", None
    accepted_sha = fields_007.get("Accepted Implementation SHA")
    if not isinstance(accepted_sha, str) or not SHA_RE.fullmatch(accepted_sha):
        return "MODULE_007_ACCEPTED_SHA_MISSING", None
    if accepted_sha == A01_BASELINE_SHA:
        return "MODULE_007_ACCEPTED_SHA_IS_A01_BASELINE", None
    report_path = _safe_handoff_path(fields_007.get("Independent QA Report"))
    if report_path is None or not report_path.startswith("docs/handoffs/007/"):
        return "MODULE_007_QA_EVIDENCE_MISSING", None
    report, missing_reason, unavailable = _required_gate_file(fetch_file, report_path)
    if unavailable:
        return None, unavailable
    if missing_reason or report is None:
        return (
            "MODULE_007_QA_EVIDENCE_MISSING"
            if missing_reason == "GATE_EVIDENCE_MISSING"
            else "MODULE_007_QA_EVIDENCE_INVALID"
        ), None
    report_fields, error = _canonical_fields(report.content)
    if error or report_fields is None:
        return "MODULE_007_QA_EVIDENCE_INVALID", None
    if (
        report_fields.get("Module") != "007"
        or report_fields.get("QA Decision") != "ACCEPTED"
        or report_fields.get("Accepted Implementation SHA") != accepted_sha
    ):
        return "MODULE_007_QA_EVIDENCE_MISMATCH", None
    if verify_commit is None:
        return "MODULE_007_COMMIT_UNVERIFIED", None
    try:
        commit_exists = verify_commit(accepted_sha)
    except AdapterUnavailable as exc:
        return None, exc.code
    if not commit_exists:
        return "MODULE_007_COMMIT_UNVERIFIED", None

    status_008, missing_reason, unavailable = _required_gate_file(
        fetch_file, "docs/handoffs/008/STATUS.md"
    )
    if unavailable:
        return None, unavailable
    if missing_reason or status_008 is None:
        return (
            "MODULE_008_STATUS_MISSING"
            if missing_reason == "GATE_EVIDENCE_MISSING"
            else "MODULE_008_STATUS_INVALID"
        ), None
    fields_008, error = _canonical_fields(status_008.content)
    if error or fields_008 is None:
        return "MODULE_008_STATUS_INVALID", None
    if fields_008.get("Module") != "008":
        return "MODULE_008_ID_MISMATCH", None
    if fields_008.get("Implementation Authorization") != "ACTIVE":
        return "MODULE_008_AUTHORIZATION_INACTIVE", None
    if fields_008.get("Implementation") != "AUTHORIZED":
        return "MODULE_008_IMPLEMENTATION_NOT_AUTHORIZED", None
    return None, None


Runner = Callable[..., subprocess.CompletedProcess[bytes]]


class GhApiClient:
    """Bounded, read-only adapter around the official GitHub CLI."""

    def __init__(
        self,
        *,
        runner: Runner = subprocess.run,
        timeout_seconds: int = 15,
        max_pages: int = 3,
        per_page: int = 30,
        retries: int = 2,
        sleeper: Callable[[float], None] = time.sleep,
    ) -> None:
        self.runner = runner
        self.timeout_seconds = min(max(timeout_seconds, 1), 30)
        self.max_pages = min(max(max_pages, 1), 5)
        self.per_page = min(max(per_page, 1), 50)
        self.retries = min(max(retries, 0), 2)
        self.sleeper = sleeper
        self.executable = shutil.which("gh")

    def ensure_available(self) -> None:
        if not self.executable:
            raise AdapterUnavailable("GH_NOT_INSTALLED", "GitHub CLI is not installed")
        self._run(["auth", "status", "--hostname", "github.com"], auth_check=True)

    def _run(self, args: list[str], *, auth_check: bool = False) -> Any:
        if not self.executable:
            raise AdapterUnavailable("GH_NOT_INSTALLED", "GitHub CLI is not installed")
        command = [self.executable, *args]
        last_code = "GH_REQUEST_FAILED"
        for attempt in range(self.retries + 1):
            try:
                completed = self.runner(
                    command,
                    check=False,
                    capture_output=True,
                    text=False,
                    timeout=self.timeout_seconds,
                    shell=False,
                )
            except subprocess.TimeoutExpired:
                last_code = "GH_TIMEOUT"
            except UnicodeError:
                last_code = "GH_MALFORMED_RESPONSE"
            except OSError:
                last_code = "GH_UNAVAILABLE"
            else:
                returncode = getattr(completed, "returncode", None)
                if not isinstance(returncode, int):
                    last_code = "GH_MALFORMED_RESPONSE"
                    if attempt < self.retries:
                        self.sleeper(0.25 * (2**attempt))
                    continue
                if returncode == 0:
                    if auth_check:
                        return {"authenticated": True}
                    stdout = getattr(completed, "stdout", None)
                    if isinstance(stdout, bytes):
                        stdout_bytes = stdout
                    elif isinstance(stdout, str):
                        try:
                            stdout_bytes = stdout.encode("utf-8", errors="strict")
                        except UnicodeError as exc:
                            raise AdapterUnavailable(
                                "GH_MALFORMED_RESPONSE", "invalid stdout text"
                            ) from exc
                    else:
                        raise AdapterUnavailable(
                            "GH_MALFORMED_RESPONSE", "stdout is missing or invalid"
                        )
                    if not stdout_bytes:
                        raise AdapterUnavailable("GH_MALFORMED_RESPONSE", "stdout is empty")
                    if len(stdout_bytes) > MAX_RESPONSE_BYTES:
                        raise AdapterUnavailable("GH_RESPONSE_TOO_LARGE", "response exceeded limit")
                    try:
                        stdout_text = stdout_bytes.decode("utf-8", errors="strict")
                        return json.loads(stdout_text)
                    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                        raise AdapterUnavailable("GH_MALFORMED_RESPONSE", "invalid JSON") from exc
                last_code = self._failure_code(
                    getattr(completed, "stderr", None), auth_check=auth_check
                )
            if attempt < self.retries:
                self.sleeper(0.25 * (2**attempt))
        raise AdapterUnavailable(last_code, "GitHub read request unavailable")

    @staticmethod
    def _failure_code(stderr: object, *, auth_check: bool) -> str:
        if isinstance(stderr, bytes):
            message = stderr[:16_384].decode("utf-8", errors="replace").lower()
        elif isinstance(stderr, str):
            message = stderr[:4_096].lower()
        else:
            message = ""
        if auth_check or "authentication" in message or "not logged" in message or "401" in message:
            return "GH_AUTH_UNAVAILABLE"
        if "rate limit" in message or "429" in message:
            return "GH_RATE_LIMITED"
        if "403" in message or "forbidden" in message:
            return "GH_FORBIDDEN"
        if "404" in message or "not found" in message:
            return "GH_NOT_FOUND"
        if "could not resolve" in message or "connection" in message or "offline" in message:
            return "GH_OFFLINE"
        return "GH_REQUEST_FAILED"

    def list_open_issues(self) -> list[dict[str, Any]]:
        self.ensure_available()
        issues: list[dict[str, Any]] = []
        page_was_full = False
        for page in range(1, self.max_pages + 1):
            endpoint = (
                f"repos/{ALLOWED_REPOSITORY}/issues?state=open&per_page={self.per_page}&page={page}"
            )
            payload = self._run(["api", "--method", "GET", endpoint])
            if not isinstance(payload, list):
                raise AdapterUnavailable("GH_MALFORMED_RESPONSE", "issues response is not a list")
            for issue in payload:
                if isinstance(issue, dict) and "pull_request" not in issue:
                    normalized = dict(issue)
                    normalized["repository_full_name"] = ALLOWED_REPOSITORY
                    issues.append(normalized)
            page_was_full = len(payload) >= self.per_page
            if not page_was_full:
                break
        if page_was_full:
            raise AdapterUnavailable("GH_PAGE_LIMIT_REACHED", "bounded page limit reached")
        return issues

    def fetch_file(self, path: str) -> FileSnapshot:
        safe_path = _safe_handoff_path(path)
        if safe_path is None:
            raise AdapterUnavailable("HANDOFF_PATH_UNSAFE", "unsafe handoff path")
        encoded_path = "/".join(quote(part, safe="") for part in PurePosixPath(safe_path).parts)
        endpoint = f"repos/{ALLOWED_REPOSITORY}/contents/{encoded_path}?ref={AUTHORITATIVE_REF}"
        payload = self._run(["api", "--method", "GET", endpoint])
        if not isinstance(payload, dict):
            raise AdapterUnavailable("GH_MALFORMED_RESPONSE", "file response is not an object")
        sha = payload.get("sha")
        content = payload.get("content")
        if (
            payload.get("type") != "file"
            or payload.get("path") != safe_path
            or payload.get("encoding") != "base64"
            or not isinstance(sha, str)
            or not SHA_RE.fullmatch(sha)
            or not isinstance(content, str)
            or not content
        ):
            raise AdapterUnavailable("GH_MALFORMED_RESPONSE", "file metadata is invalid")
        try:
            encoded = content.encode("ascii")
            if len(encoded) > MAX_RESPONSE_BYTES:
                raise ValueError("encoded file exceeds limit")
            normalized = re.sub(rb"[\r\n\t ]", b"", encoded)
            if not normalized:
                raise ValueError("empty encoded file")
            decoded_bytes = base64.b64decode(normalized, validate=True)
            if not decoded_bytes or len(decoded_bytes) > MAX_FILE_BYTES:
                raise ValueError("decoded file size invalid")
            computed_sha = hashlib.sha1(
                f"blob {len(decoded_bytes)}\0".encode("ascii") + decoded_bytes
            ).hexdigest()
            if computed_sha != sha:
                raise ValueError("blob identity mismatch")
            decoded = decoded_bytes.decode("utf-8")
        except (binascii.Error, ValueError, UnicodeDecodeError, UnicodeEncodeError) as exc:
            raise AdapterUnavailable("GH_MALFORMED_RESPONSE", "file content is invalid") from exc
        return FileSnapshot(safe_path, sha, decoded)

    def commit_exists(self, sha: str) -> bool:
        if not SHA_RE.fullmatch(sha):
            return False
        endpoint = f"repos/{ALLOWED_REPOSITORY}/git/commits/{sha}"
        payload = self._run(["api", "--method", "GET", endpoint])
        return isinstance(payload, dict) and payload.get("sha") == sha


class ReceiptStore:
    def __init__(self, path: Path | None = None, *, enabled: bool = True) -> None:
        self.enabled = enabled
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
        self.path = path or base / "PersonalWorkspace" / "dispatch-inbox" / "receipts.json"

    def _load(self) -> dict[str, Any]:
        if not self.enabled or not self.path.exists():
            return {"version": 1, "entries": {}}
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {"version": 1, "entries": {}}
        if not isinstance(data, dict) or data.get("version") != 1 or not isinstance(data.get("entries"), dict):
            return {"version": 1, "entries": {}}
        return data

    def record(self, result: Classification) -> Classification:
        if not self.enabled or result.issue_number is None or result.dispatch_id is None:
            return result
        data = self._load()
        entries: dict[str, Any] = data["entries"]
        key = f"{result.issue_number}:{result.dispatch_id}"
        duplicate = key in entries
        entries[key] = {
            "classification": result.classification,
            "reason_code": result.reason_code,
            "observed_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        if len(entries) > MAX_RECEIPTS:
            ordered = list(entries.items())[-MAX_RECEIPTS:]
            data["entries"] = dict(ordered)
        self._write_atomic(data)
        return dataclasses.replace(result, duplicate=duplicate)

    def _write_atomic(self, data: Mapping[str, Any]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary = tempfile.mkstemp(prefix="receipts-", suffix=".tmp", dir=self.path.parent)
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
                json.dump(data, handle, sort_keys=True, separators=(",", ":"))
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, self.path)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)


def process_issues(
    issues: Iterable[Mapping[str, Any]],
    fetch_file: FileFetcher,
    receipt_store: ReceiptStore,
    *,
    now: dt.datetime | None = None,
    verify_commit: CommitVerifier | None = None,
) -> list[Classification]:
    results: list[Classification] = []
    for issue in issues:
        result = classify_issue(issue, fetch_file, now=now, verify_commit=verify_commit)
        results.append(receipt_store.record(result))
    return results


def _fixture_source(path: Path) -> tuple[list[dict[str, Any]], FileFetcher, CommitVerifier]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise AdapterUnavailable("FIXTURE_INVALID", "fixture cannot be read") from exc
    if not isinstance(data, dict) or not isinstance(data.get("issues"), list) or not isinstance(data.get("files"), dict):
        raise AdapterUnavailable("FIXTURE_INVALID", "fixture shape is invalid")
    files = data["files"]
    commits = data.get("commits", [])
    if not isinstance(commits, list) or not all(isinstance(item, str) for item in commits):
        raise AdapterUnavailable("FIXTURE_INVALID", "fixture commits are invalid")

    def fetch_file(file_path: str) -> FileSnapshot:
        item = files.get(file_path)
        if not isinstance(item, dict):
            raise AdapterUnavailable("FIXTURE_FILE_MISSING", "fixture file missing")
        return FileSnapshot(
            file_path,
            str(item.get("sha", "")),
            str(item.get("content", "")),
            str(item.get("ref", AUTHORITATIVE_REF)),
        )

    return (
        [item for item in data["issues"] if isinstance(item, dict)],
        fetch_file,
        lambda sha: sha in commits,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Read-only Personal Workspace GitHub dispatch inbox")
    parser.add_argument("--once", action="store_true", help="perform exactly one bounded poll")
    parser.add_argument("--dry-run", action="store_true", help="classify only; never dispatch")
    parser.add_argument("--fixture", type=Path, help="use a local test fixture instead of GitHub")
    parser.add_argument("--no-receipts", action="store_true", help="disable local dedupe receipt persistence")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if not args.once or not args.dry_run:
        print(json.dumps({"classification": "UNAVAILABLE", "reason_code": "DRY_RUN_FLAGS_REQUIRED"}))
        return 64
    receipt_store = ReceiptStore(enabled=not args.no_receipts)
    try:
        if args.fixture:
            issues, fetch_file, verify_commit = _fixture_source(args.fixture)
        else:
            client = GhApiClient()
            issues = client.list_open_issues()
            fetch_file = client.fetch_file
            verify_commit = client.commit_exists
        results = process_issues(
            issues, fetch_file, receipt_store, verify_commit=verify_commit
        )
    except AdapterUnavailable as exc:
        result = Classification(None, None, "UNAVAILABLE", exc.code)
        print(json.dumps(result.as_public_dict(), sort_keys=True))
        return 2

    if not results:
        result = Classification(None, None, "UNAVAILABLE", "NO_ELIGIBLE_TASKS")
        print(json.dumps(result.as_public_dict(), sort_keys=True))
        return 0
    for result in results:
        print(json.dumps(result.as_public_dict(), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
