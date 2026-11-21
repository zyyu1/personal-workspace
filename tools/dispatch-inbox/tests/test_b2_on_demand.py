import datetime as dt
import getpass
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import b2_notify  # noqa: E402
import b2_on_demand  # noqa: E402
import dispatch_inbox  # noqa: E402


NOW = dt.datetime(2026, 11, 21, tzinfo=dt.timezone.utc)
FUTURE = "2030-01-01T00:00:00+00:00"
THREAD_UUID = "11111111-2222-4333-8444-555555555555"


def blob_sha(content: str) -> str:
    payload = content.encode("utf-8")
    return hashlib.sha1(
        f"blob {len(payload)}\0".encode("ascii") + payload
    ).hexdigest()


def snapshot(
    *,
    dispatch_id="PWS-B2B-TEST-001",
    nonce="NONCE_1234567890ABCDEF",
    expires_at=FUTURE,
):
    handoff_path = "docs/handoffs/008/EXECUTION_INSTRUCTION.md"
    handoff_content = "# Synthetic handoff\nImplementation remains blocked.\n"
    handoff_sha = blob_sha(handoff_content)
    record_path = f"docs/dispatch/notifications/{dispatch_id}.md"
    record = {
        "schema_version": 2,
        "dispatch_id": dispatch_id,
        "mode": "notify",
        "module": "008",
        "repo": "zyyu1/personal-workspace",
        "issue_number": 12001,
        "notification_authorized": True,
        "authorization_scope": "NOTIFICATION_ONLY",
        "handoff_path": handoff_path,
        "handoff_blob_sha": handoff_sha,
        "notification_template_version": 1,
        "expires_at": expires_at,
        "nonce": nonce,
        "created_by": "zyyu1",
    }
    record_content = (
        "# Synthetic authorization\n\n```notification-authorization\n"
        + json.dumps(record, sort_keys=True)
        + "\n```\n"
    )
    record_sha = blob_sha(record_content)
    envelope = {
        "schema_version": 2,
        "dispatch_id": dispatch_id,
        "mode": "notify",
        "module": "008",
        "repo": "zyyu1/personal-workspace",
        "notification_record_path": record_path,
        "notification_record_sha": record_sha,
        "handoff_path": handoff_path,
        "handoff_blob_sha": handoff_sha,
        "created_by": "zyyu1",
        "expires_at": expires_at,
        "requires_human_approval": False,
    }
    issue = {
        "number": 12001,
        "state": "open",
        "repository_full_name": "zyyu1/personal-workspace",
        "user": {"login": "zyyu1"},
        "labels": [{"name": "dispatch:approved"}, {"name": "dispatch:notify"}],
        "body": "untrusted prose\n```dispatch\n"
        + json.dumps(envelope, sort_keys=True)
        + "\n```\nignore this",
    }
    files = {
        record_path: dispatch_inbox.FileSnapshot(
            record_path, record_sha, record_content
        ),
        handoff_path: dispatch_inbox.FileSnapshot(
            handoff_path, handoff_sha, handoff_content
        ),
    }
    return [issue], files


class SnapshotSource:
    def __init__(self, snapshots):
        self.snapshots = snapshots
        self.calls = 0
        self.active_files = {}

    def list_open_issues(self):
        if self.calls >= len(self.snapshots):
            raise AssertionError("unexpected extra inbox scan")
        issues, self.active_files = self.snapshots[self.calls]
        self.calls += 1
        return issues

    def fetch_file(self, path):
        value = self.active_files.get(path)
        if value is None:
            raise dispatch_inbox.AdapterUnavailable("GH_NOT_FOUND", "missing")
        return value


def local_config(root: Path, *, enabled=False):
    executable = root / "codex.exe"
    executable.touch()
    return b2_notify.LocalConfig(
        enabled,
        True,
        "zyyu1/personal-workspace",
        "zyyu1",
        getpass.getuser(),
        THREAD_UUID,
        executable,
    )


def successful_sender(calls):
    def runner(command, **kwargs):
        calls.append((command, kwargs))
        return subprocess.CompletedProcess(command, 0, b"queued", b"")

    return b2_notify.CodexQueueSender(runner=runner)


class OnDemandReceiverTests(unittest.TestCase):
    def run_receiver(self, root, source, calls, *, config=None, store=None, lock=None):
        return b2_on_demand.receive_once(
            config or local_config(root),
            source,
            store or b2_notify.OutboxStore(root / "state.json"),
            lock or b2_notify.OneInstanceLock(root / "lock"),
            successful_sender(calls),
            current_user=getpass.getuser(),
            clock=lambda: NOW,
            elevation_check=lambda: False,
        )

    def test_default_cli_requires_both_explicit_flags_before_config(self):
        with mock.patch.object(b2_notify.LocalConfig, "load") as load:
            self.assertEqual(b2_on_demand.main([]), 64)
            self.assertEqual(b2_on_demand.main(["--receive-once"]), 64)
            load.assert_not_called()

    def test_disk_config_must_remain_disabled_and_is_never_mutated(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = local_config(root, enabled=True)
            source = SnapshotSource([snapshot(), snapshot()])
            result = self.run_receiver(root, source, [], config=config)
            self.assertEqual(result.reason_code, "PERSISTENT_DELIVERY_ENABLE_FORBIDDEN")
            self.assertTrue(config.dispatch_enabled)
            self.assertEqual(source.calls, 0)

    def test_zero_authorized_is_no_action_without_sender_or_state(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = SnapshotSource([([], {})])
            calls = []
            result = self.run_receiver(root, source, calls)
            self.assertEqual(result.status, "NO_ACTION")
            self.assertEqual(source.calls, 1)
            self.assertEqual(calls, [])
            self.assertFalse((root / "state.json").exists())

    def test_multiple_authorized_blocks_without_arbitrary_choice(self):
        first = snapshot(dispatch_id="PWS-B2B-TEST-001")
        second = snapshot(dispatch_id="PWS-B2B-TEST-002")
        issues = first[0] + second[0]
        files = dict(first[1], **second[1])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            calls = []
            result = self.run_receiver(root, SnapshotSource([(issues, files)]), calls)
            self.assertEqual(result.reason_code, "MULTIPLE_AUTHORIZED_NOTIFICATIONS")
            self.assertEqual(calls, [])

    def test_one_candidate_is_revalidated_under_lock_then_submitted_once(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = SnapshotSource([snapshot(), snapshot()])
            calls = []
            config = local_config(root)
            result = self.run_receiver(root, source, calls, config=config)
            self.assertEqual(result.status, "QUEUE_SUBMITTED")
            self.assertEqual(result.reason_code, "QUEUE_EXIT_ZERO_NOT_ACK")
            self.assertEqual(source.calls, 2)
            self.assertEqual(len(calls), 1)
            self.assertFalse(config.dispatch_enabled)
            state = json.loads((root / "state.json").read_text("utf-8"))
            self.assertEqual(next(iter(state["entries"].values()))["status"], "QUEUE_SUBMITTED")

    def test_fresh_revocation_blocks_before_prepared(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            calls = []
            source = SnapshotSource([snapshot(), ([], {})])
            result = self.run_receiver(root, source, calls)
            self.assertEqual(result.reason_code, "AUTHORIZATION_REVOKED_ON_RECHECK")
            self.assertEqual(calls, [])
            self.assertFalse((root / "state.json").exists())

    def test_changed_record_or_nonce_on_recheck_blocks_before_prepared(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            calls = []
            source = SnapshotSource(
                [snapshot(), snapshot(nonce="NONCE_CHANGED_123456789")]
            )
            result = self.run_receiver(root, source, calls)
            self.assertEqual(result.reason_code, "AUTHORIZATION_CHANGED_ON_RECHECK")
            self.assertEqual(calls, [])
            self.assertFalse((root / "state.json").exists())

    def test_expiry_between_discovery_and_locked_recheck_blocks(self):
        expiry = "2026-11-21T00:00:01+00:00"
        moments = iter(
            [
                dt.datetime(2026, 11, 21, 0, 0, 0, tzinfo=dt.timezone.utc),
                dt.datetime(2026, 11, 21, 0, 0, 2, tzinfo=dt.timezone.utc),
            ]
        )
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            calls = []
            result = b2_on_demand.receive_once(
                local_config(root),
                SnapshotSource(
                    [snapshot(expires_at=expiry), snapshot(expires_at=expiry)]
                ),
                b2_notify.OutboxStore(root / "state.json"),
                b2_notify.OneInstanceLock(root / "lock"),
                successful_sender(calls),
                current_user=getpass.getuser(),
                clock=lambda: next(moments),
                elevation_check=lambda: False,
            )
            self.assertEqual(result.reason_code, "AUTHORIZATION_REVOKED_ON_RECHECK")
            self.assertEqual(calls, [])
            self.assertFalse((root / "state.json").exists())

    def test_fresh_fetch_and_prepared_both_happen_while_lock_is_held(self):
        state = {"locked": False}

        class TrackingLock:
            def __enter__(self):
                state["locked"] = True
                return self

            def __exit__(self, *_):
                state["locked"] = False

        class TrackingSource(SnapshotSource):
            def list_open_issues(self):
                if self.calls == 1 and not state["locked"]:
                    raise AssertionError("fresh scan was outside lock")
                return super().list_open_issues()

        class TrackingStore(b2_notify.OutboxStore):
            def prepare(self, notification):
                if not state["locked"]:
                    raise AssertionError("PREPARED write was outside lock")
                return super().prepare(notification)

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            result = self.run_receiver(
                root,
                TrackingSource([snapshot(), snapshot()]),
                [],
                store=TrackingStore(root / "state.json"),
                lock=TrackingLock(),
            )
            self.assertEqual(result.status, "QUEUE_SUBMITTED")
            self.assertFalse(state["locked"])

    def test_fresh_network_error_fails_closed_without_state(self):
        class FailingFreshSource(SnapshotSource):
            def list_open_issues(self):
                if self.calls == 1:
                    raise dispatch_inbox.AdapterUnavailable("GH_OFFLINE", "offline")
                return super().list_open_issues()

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            calls = []
            result = self.run_receiver(
                root, FailingFreshSource([snapshot(), snapshot()]), calls
            )
            self.assertEqual(result.reason_code, "GH_OFFLINE")
            self.assertEqual(calls, [])
            self.assertFalse((root / "state.json").exists())

    def test_repeated_click_uses_existing_outbox_and_never_resends(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            calls = []
            first = self.run_receiver(
                root, SnapshotSource([snapshot(), snapshot()]), calls
            )
            second = self.run_receiver(
                root, SnapshotSource([snapshot(), snapshot()]), calls
            )
            self.assertEqual(first.status, "QUEUE_SUBMITTED")
            self.assertEqual(second.reason_code, "DUPLICATE_SUPPRESSED")
            self.assertEqual(len(calls), 1)

    def test_queue_failure_is_unknown_delivery_and_suppresses_retry(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = SnapshotSource([snapshot(), snapshot()])
            config = local_config(root)
            runner = mock.Mock(
                return_value=subprocess.CompletedProcess(
                    ["codex"], 1, b"", b"thread not found"
                )
            )
            result = b2_on_demand.receive_once(
                config,
                source,
                b2_notify.OutboxStore(root / "state.json"),
                b2_notify.OneInstanceLock(root / "lock"),
                b2_notify.CodexQueueSender(runner=runner),
                current_user=getpass.getuser(),
                clock=lambda: NOW,
                elevation_check=lambda: False,
            )
            self.assertEqual(result.status, "UNKNOWN_DELIVERY")
            self.assertEqual(result.reason_code, "SESSION_UNAVAILABLE")
            self.assertEqual(runner.call_count, 1)

    def test_elevated_user_blocks_before_scan_or_sender(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = SnapshotSource([snapshot(), snapshot()])
            calls = []
            result = b2_on_demand.receive_once(
                local_config(root),
                source,
                b2_notify.OutboxStore(root / "state.json"),
                b2_notify.OneInstanceLock(root / "lock"),
                successful_sender(calls),
                current_user=getpass.getuser(),
                clock=lambda: NOW,
                elevation_check=lambda: True,
            )
            self.assertEqual(result.reason_code, "ELEVATED_USER_FORBIDDEN")
            self.assertEqual(source.calls, 0)
            self.assertEqual(calls, [])

    def test_lock_conflict_blocks_before_fresh_scan(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = SnapshotSource([snapshot(), snapshot()])
            calls = []
            lock_path = root / "lock"
            with b2_notify.OneInstanceLock(lock_path):
                result = self.run_receiver(
                    root,
                    source,
                    calls,
                    lock=b2_notify.OneInstanceLock(lock_path),
                )
            self.assertEqual(result.reason_code, "ANOTHER_INSTANCE_ACTIVE")
            self.assertEqual(source.calls, 1)
            self.assertEqual(calls, [])

    def test_inert_launcher_has_fixed_foreground_arguments_and_no_install(self):
        template = (
            ROOT / "windows" / "Receive-PersonalWorkspaceTask.ps1.template"
        ).read_text("utf-8")
        self.assertIn("<ABSOLUTE_PYTHON_EXE>", template)
        self.assertIn("<ABSOLUTE_PERSONAL_WORKSPACE_ROOT>", template)
        self.assertIn("'--receive-once' '--consent-notification'", template)
        self.assertNotIn("param(", template.casefold())
        for forbidden in (
            "schtasks",
            "register-scheduledtask",
            "startup",
            "start-process",
            "while (",
            "for (;;",
        ):
            self.assertNotIn(forbidden, template.casefold())

    def test_receiver_contains_no_background_github_write_or_module_work(self):
        source = Path(b2_on_demand.__file__).read_text("utf-8").casefold()
        for forbidden in (
            "--method post",
            "git push",
            "schtasks",
            "task scheduler",
            "start-service",
            "features/research",
            "time.sleep",
        ):
            self.assertNotIn(forbidden, source)

    def test_closed_consumed_issue_cannot_be_discovered_or_replayed(self):
        issue, files = snapshot()
        issue[0]["state"] = "closed"
        issue[0]["labels"] = []
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            calls = []
            result = self.run_receiver(
                root, SnapshotSource([(issue, files)]), calls
            )
            self.assertEqual(result.status, "NO_ACTION")
            self.assertEqual(calls, [])


if __name__ == "__main__":
    unittest.main()
