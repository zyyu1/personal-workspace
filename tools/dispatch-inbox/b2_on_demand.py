#!/usr/bin/env python3
"""Finite, user-initiated B2B V1.1 notification receiver.

The receiver performs one discovery snapshot, then (only for one authorized
candidate) acquires the existing B2 lock and performs one fresh authorization
snapshot before the durable PREPARED write.  It has no loop, scheduler,
service, retry, GitHub write, or automatic startup behavior.
"""

from __future__ import annotations

import argparse
import ctypes
import dataclasses
import datetime as dt
import json
import os
from pathlib import Path
from typing import Callable, Protocol

import b2_notify
import dispatch_inbox


class NotificationSource(Protocol):
    def list_open_issues(self) -> list[dict[str, object]]: ...

    def fetch_file(self, path: str) -> dispatch_inbox.FileSnapshot: ...


Clock = Callable[[], dt.datetime]
ElevationCheck = Callable[[], bool]


def _utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _is_elevated() -> bool:
    if os.name != "nt":
        return False
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin())  # type: ignore[attr-defined]
    except (AttributeError, OSError) as exc:
        raise b2_notify.B2Error("ELEVATION_CHECK_UNAVAILABLE") from exc


def _authorized_snapshot(
    source: NotificationSource,
    *,
    now: dt.datetime,
) -> list[b2_notify.AuthorizedNotification]:
    """Read one bounded issue snapshot and strictly validate every candidate."""
    issues = source.list_open_issues()
    authorized: list[b2_notify.AuthorizedNotification] = []
    for issue in issues:
        notification, _ = b2_notify.validate_notification(
            issue, source.fetch_file, now=now
        )
        if notification is not None:
            authorized.append(notification)
    return authorized


def _ephemeral_consent_config(
    config: b2_notify.LocalConfig,
    *,
    current_user: str | None,
) -> b2_notify.LocalConfig:
    """Create invocation-only consent without changing the persisted config."""
    if config.dispatch_enabled:
        raise b2_notify.B2Error("PERSISTENT_DELIVERY_ENABLE_FORBIDDEN")
    if not config.notification_only:
        raise b2_notify.B2Error("NOTIFICATION_ONLY_REQUIRED")
    runtime = dataclasses.replace(config, dispatch_enabled=True)
    runtime.validate_runtime(current_user=current_user)
    return runtime


def receive_once(
    config: b2_notify.LocalConfig,
    source: NotificationSource,
    store: b2_notify.OutboxStore,
    lock: b2_notify.OneInstanceLock,
    sender: b2_notify.CodexQueueSender,
    *,
    current_user: str | None = None,
    clock: Clock = _utc_now,
    elevation_check: ElevationCheck = _is_elevated,
) -> b2_notify.NotifyResult:
    """Perform one finite on-demand receive attempt and then return."""
    try:
        if elevation_check():
            raise b2_notify.B2Error("ELEVATED_USER_FORBIDDEN")
        runtime_config = _ephemeral_consent_config(
            config, current_user=current_user
        )
        initial = _authorized_snapshot(source, now=clock())
        if not initial:
            return b2_notify.NotifyResult("NO_ACTION", "NO_AUTHORIZED_NOTIFICATION")
        if len(initial) != 1:
            return b2_notify.NotifyResult(
                "BLOCKED", "MULTIPLE_AUTHORIZED_NOTIFICATIONS"
            )
        candidate = initial[0]

        with lock:
            fresh = _authorized_snapshot(source, now=clock())
            if not fresh:
                return b2_notify.NotifyResult(
                    "BLOCKED",
                    "AUTHORIZATION_REVOKED_ON_RECHECK",
                    candidate.issue_number,
                    candidate.dispatch_id,
                    candidate.notification_record_sha,
                )
            if len(fresh) != 1:
                return b2_notify.NotifyResult(
                    "BLOCKED",
                    "MULTIPLE_AUTHORIZED_NOTIFICATIONS_ON_RECHECK",
                    candidate.issue_number,
                    candidate.dispatch_id,
                    candidate.notification_record_sha,
                )
            if fresh[0] != candidate:
                return b2_notify.NotifyResult(
                    "BLOCKED",
                    "AUTHORIZATION_CHANGED_ON_RECHECK",
                    candidate.issue_number,
                    candidate.dispatch_id,
                    candidate.notification_record_sha,
                )
            return b2_notify.attempt_notification_locked(
                fresh[0],
                runtime_config,
                store,
                sender,
                current_user=current_user,
                now=clock(),
            )
    except (b2_notify.B2Error, dispatch_inbox.AdapterUnavailable) as exc:
        return b2_notify.NotifyResult("BLOCKED", exc.code)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="One-click, finite Personal Workspace B2B receiver"
    )
    parser.add_argument(
        "--receive-once",
        action="store_true",
        help="perform one foreground discovery and fresh authorization check",
    )
    parser.add_argument(
        "--consent-notification",
        action="store_true",
        help="grant notification-only consent for this process invocation",
    )
    return parser


def _print(result: b2_notify.NotifyResult) -> None:
    print(json.dumps(result.as_public_dict(), sort_keys=True))


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if not args.receive_once or not args.consent_notification:
        _print(b2_notify.NotifyResult("BLOCKED", "EXPLICIT_ON_DEMAND_CONSENT_REQUIRED"))
        return 64

    local_dir = b2_notify.default_local_dir()
    try:
        config_path = local_dir / "b2-notify-config.json"
        config = b2_notify.LocalConfig.load(config_path)
        result = receive_once(
            config,
            dispatch_inbox.GhApiClient(),
            b2_notify.OutboxStore(local_dir / "b2-outbox.json"),
            b2_notify.OneInstanceLock(local_dir / "b2-notify.lock"),
            b2_notify.CodexQueueSender(),
        )
    except (b2_notify.B2Error, dispatch_inbox.AdapterUnavailable) as exc:
        result = b2_notify.NotifyResult("BLOCKED", exc.code)
    _print(result)
    return 0 if result.status in {"NO_ACTION", "QUEUE_SUBMITTED"} else 2


if __name__ == "__main__":
    raise SystemExit(main())
