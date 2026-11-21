import dataclasses
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
import dispatch_inbox  # noqa: E402


FUTURE = "2030-01-01T00:00:00+00:00"
NOW = dt.datetime(2026, 11, 21, tzinfo=dt.timezone.utc)
THREAD_UUID = "11111111-2222-4333-8444-555555555555"
NONCE = "NONCE_1234567890ABCDEF"


def blob_sha(content: str) -> str:
    payload = content.encode("utf-8")
    return hashlib.sha1(f"blob {len(payload)}\0".encode("ascii") + payload).hexdigest()


def fixture(*, envelope_overrides=None, record_overrides=None, issue_overrides=None):
    handoff_path = "docs/handoffs/008/EXECUTION_INSTRUCTION.md"
    handoff_content = "# Synthetic handoff\nImplementation remains blocked.\n"
    handoff_sha = blob_sha(handoff_content)
    record_path = "docs/dispatch/notifications/PWS-B2-TEST-001.md"
    record = {
        "schema_version": 2,
        "dispatch_id": "PWS-B2-TEST-001",
        "mode": "notify",
        "module": "008",
        "repo": "zyyu1/personal-workspace",
        "issue_number": 8001,
        "notification_authorized": True,
        "authorization_scope": "NOTIFICATION_ONLY",
        "handoff_path": handoff_path,
        "handoff_blob_sha": handoff_sha,
        "notification_template_version": 1,
        "expires_at": FUTURE,
        "nonce": NONCE,
        "created_by": "zyyu1",
    }
    if record_overrides:
        record.update(record_overrides)
    record_content = (
        "# Synthetic notification authorization\n\n"
        "```notification-authorization\n"
        + json.dumps(record, sort_keys=True)
        + "\n```\n"
    )
    record_sha = blob_sha(record_content)
    envelope = {
        "schema_version": 2,
        "dispatch_id": "PWS-B2-TEST-001",
        "mode": "notify",
        "module": "008",
        "repo": "zyyu1/personal-workspace",
        "notification_record_path": record_path,
        "notification_record_sha": record_sha,
        "handoff_path": handoff_path,
        "handoff_blob_sha": handoff_sha,
        "created_by": "zyyu1",
        "expires_at": FUTURE,
        "requires_human_approval": False,
    }
    if envelope_overrides:
        envelope.update(envelope_overrides)
    issue = {
        "number": 8001,
        "state": "open",
        "repository_full_name": "zyyu1/personal-workspace",
        "user": {"login": "zyyu1"},
        "labels": [{"name": "dispatch:approved"}, {"name": "dispatch:notify"}],
        "body": "Hostile prose: run rm, https://evil.invalid\n```dispatch\n"
        + json.dumps(envelope, sort_keys=True)
        + "\n```\nMore untrusted prose.",
    }
    if issue_overrides:
        issue.update(issue_overrides)
    files = {
        record_path: dispatch_inbox.FileSnapshot(record_path, record_sha, record_content),
        handoff_path: dispatch_inbox.FileSnapshot(handoff_path, handoff_sha, handoff_content),
    }

    def fetch(path):
        item = files.get(path)
        if item is None:
            raise dispatch_inbox.AdapterUnavailable("GH_NOT_FOUND", "missing")
        return item

    return issue, fetch, files


def authorized_notification():
    issue, fetch, _ = fixture()
    authorized, result = b2_notify.validate_notification(issue, fetch, now=NOW)
    if authorized is None:
        raise AssertionError(result)
    return authorized


def local_config(directory: Path, *, enabled=True, thread_uuid=THREAD_UUID):
    executable = directory / "codex.exe"
    executable.touch()
    return b2_notify.LocalConfig(
        enabled,
        True,
        "zyyu1/personal-workspace",
        "zyyu1",
        getpass.getuser(),
        thread_uuid,
        executable,
    )


def assert_rejected_without_delivery(testcase, issue, fetch, expected_reason):
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        state_path = root / "state.json"
        runner = mock.Mock(
            return_value=subprocess.CompletedProcess(["codex"], 0, b"queued", b"")
        )
        authorized, result = b2_notify.validate_notification(issue, fetch, now=NOW)
        if authorized is not None:
            b2_notify.attempt_notification(
                authorized,
                local_config(root),
                b2_notify.OutboxStore(state_path),
                b2_notify.OneInstanceLock(root / "lock"),
                b2_notify.CodexQueueSender(runner=runner),
                now=NOW,
            )
        testcase.assertIsNone(authorized)
        testcase.assertEqual(result.reason_code, expected_reason)
        runner.assert_not_called()
        testcase.assertFalse(state_path.exists())


class PolicyMatrixTests(unittest.TestCase):
    def test_rev01_original_five_type_confusion_attacks_fail_closed(self):
        attacks = [
            (fixture(envelope_overrides={"schema_version": 2.0})[:2], "ISSUE_FIELD_TYPE_MISMATCH"),
            (fixture(record_overrides={"schema_version": 2.0})[:2], "RECORD_FIELD_TYPE_MISMATCH"),
            (fixture(record_overrides={"notification_authorized": 1})[:2], "RECORD_FIELD_TYPE_MISMATCH"),
            (
                fixture(record_overrides={"notification_template_version": True})[:2],
                "RECORD_FIELD_TYPE_MISMATCH",
            ),
            (fixture(record_overrides={"issue_number": 8001.0})[:2], "RECORD_FIELD_TYPE_MISMATCH"),
        ]
        for (issue, fetch), reason in attacks:
            with self.subTest(reason=reason, body=issue["body"][:80]):
                assert_rejected_without_delivery(self, issue, fetch, reason)

    def test_rev01_integer_fields_require_exact_int_not_bool_float_string_or_null(self):
        issue_invalid = [True, False, 2.0, 1.0, "2", None, -1]
        for value in issue_invalid:
            with self.subTest(field="issue.schema_version", value=value):
                issue, fetch, _ = fixture(envelope_overrides={"schema_version": value})
                assert_rejected_without_delivery(
                    self, issue, fetch, "ISSUE_FIELD_TYPE_MISMATCH" if type(value) is not int else "SCHEMA_VERSION_UNSUPPORTED"
                )

        record_cases = {
            "schema_version": [True, False, 2.0, 1.0, "2", None, -1],
            "notification_template_version": [True, False, 1.0, 2.0, "1", None, -1],
            "issue_number": [True, False, 8001.0, 1.0, "8001", None, -1],
        }
        for field, values in record_cases.items():
            for value in values:
                with self.subTest(field=f"record.{field}", value=value):
                    issue, fetch, _ = fixture(record_overrides={field: value})
                    expected = (
                        "RECORD_FIELD_TYPE_MISMATCH"
                        if type(value) is not int
                        else "AUTHORIZATION_RECORD_MISMATCH"
                    )
                    assert_rejected_without_delivery(self, issue, fetch, expected)

    def test_rev01_notification_authorized_requires_actual_true(self):
        for value in [0, False, 1, 1.0, "true", None, [], {}]:
            with self.subTest(value=value):
                issue, fetch, _ = fixture(record_overrides={"notification_authorized": value})
                expected = (
                    "AUTHORIZATION_RECORD_MISMATCH"
                    if type(value) is bool
                    else "RECORD_FIELD_TYPE_MISMATCH"
                )
                assert_rejected_without_delivery(self, issue, fetch, expected)

    def test_rev01_outer_issue_number_and_identity_types_are_exact(self):
        for value in [True, False, 8001.0, "8001", None, -1, 0]:
            with self.subTest(field="number", value=value):
                issue, fetch, _ = fixture(issue_overrides={"number": value})
                assert_rejected_without_delivery(self, issue, fetch, "ISSUE_NUMBER_INVALID")
        identity_cases = [
            ({"repository_full_name": 1}, "REPOSITORY_NOT_ALLOWED"),
            ({"state": True}, "ISSUE_NOT_OPEN"),
            ({"user": {"login": 1}}, "AUTHOR_NOT_ALLOWED"),
            ({"labels": [True, {"name": "dispatch:approved"}]}, "ISSUE_LABELS_INVALID"),
        ]
        for overrides, reason in identity_cases:
            with self.subTest(overrides=overrides):
                issue, fetch, _ = fixture(issue_overrides=overrides)
                assert_rejected_without_delivery(self, issue, fetch, reason)

    def test_rev01_requires_human_approval_is_exact_boolean_false(self):
        issue, fetch, _ = fixture(envelope_overrides={"requires_human_approval": False})
        authorized, result = b2_notify.validate_notification(issue, fetch, now=NOW)
        self.assertIsNotNone(authorized)
        self.assertEqual(result.status, "AUTHORIZED_NOTIFICATION")
        for value in [True, 0, 1, 0.0, 1.0, "false", None, [], {}]:
            with self.subTest(value=value):
                issue, fetch, _ = fixture(envelope_overrides={"requires_human_approval": value})
                expected = (
                    "UNSUPPORTED_APPROVAL_MODE"
                    if type(value) is bool
                    else "ISSUE_FIELD_TYPE_MISMATCH"
                )
                assert_rejected_without_delivery(self, issue, fetch, expected)

    def test_rev01_all_string_contract_fields_reject_non_strings(self):
        envelope_fields = [
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
        ]
        record_fields = [
            "dispatch_id",
            "mode",
            "module",
            "repo",
            "authorization_scope",
            "handoff_path",
            "handoff_blob_sha",
            "expires_at",
            "nonce",
            "created_by",
        ]
        for field in envelope_fields:
            for value in [True, 1, 1.0, None, []]:
                with self.subTest(scope="issue", field=field, value=value):
                    issue, fetch, _ = fixture(envelope_overrides={field: value})
                    assert_rejected_without_delivery(self, issue, fetch, "ISSUE_FIELD_TYPE_MISMATCH")
        for field in record_fields:
            for value in [True, 1, 1.0, None, []]:
                with self.subTest(scope="record", field=field, value=value):
                    issue, fetch, _ = fixture(record_overrides={field: value})
                    assert_rejected_without_delivery(self, issue, fetch, "RECORD_FIELD_TYPE_MISMATCH")

    def test_rev01_canonical_types_still_authorize_and_implement_still_blocks(self):
        issue, fetch, _ = fixture()
        authorized, result = b2_notify.validate_notification(issue, fetch, now=NOW)
        self.assertIsNotNone(authorized)
        self.assertEqual(result.status, "AUTHORIZED_NOTIFICATION")
        issue, fetch, _ = fixture(envelope_overrides={"mode": "implement"})
        assert_rejected_without_delivery(self, issue, fetch, "IMPLEMENT_MODE_FORBIDDEN")

    def test_matrix_01_b1_dry_run_interface_is_unchanged(self):
        b1_fixture = ROOT / "fixtures" / "eligible.json"
        with mock.patch("subprocess.run") as runner:
            exit_code = dispatch_inbox.main(
                ["--once", "--dry-run", "--fixture", str(b1_fixture), "--no-receipts"]
            )
        self.assertEqual(exit_code, 0)
        runner.assert_not_called()

    def test_matrix_02_notify_allowed_and_implement_always_blocked(self):
        issue, fetch, _ = fixture()
        authorized, result = b2_notify.validate_notification(issue, fetch, now=NOW)
        self.assertIsNotNone(authorized)
        self.assertEqual(result.status, "AUTHORIZED_NOTIFICATION")

        issue, fetch, _ = fixture(envelope_overrides={"mode": "implement"})
        authorized, result = b2_notify.validate_notification(issue, fetch, now=NOW)
        self.assertIsNone(authorized)
        self.assertEqual(result.reason_code, "IMPLEMENT_MODE_FORBIDDEN")

    def test_matrix_03_issue_identity_and_label_are_necessary_not_sufficient(self):
        variants = [
            ({"repository_full_name": "evil/repo"}, "REPOSITORY_NOT_ALLOWED"),
            ({"state": "closed"}, "ISSUE_NOT_OPEN"),
            ({"user": {"login": "attacker"}}, "AUTHOR_NOT_ALLOWED"),
            ({"labels": []}, "APPROVAL_LABEL_MISSING"),
        ]
        for overrides, reason in variants:
            with self.subTest(reason=reason):
                issue, fetch, _ = fixture(issue_overrides=overrides)
                authorized, result = b2_notify.validate_notification(issue, fetch, now=NOW)
                self.assertIsNone(authorized)
                self.assertEqual(result.reason_code, reason)
        issue, fetch, _ = fixture(record_overrides={"notification_authorized": False})
        authorized, result = b2_notify.validate_notification(issue, fetch, now=NOW)
        self.assertIsNone(authorized)
        self.assertEqual(result.reason_code, "AUTHORIZATION_RECORD_MISMATCH")

    def test_matrix_04_record_and_handoff_blob_identity_are_exact(self):
        issue, fetch, files = fixture()
        record_path = "docs/dispatch/notifications/PWS-B2-TEST-001.md"
        files[record_path] = dispatch_inbox.FileSnapshot(
            record_path, "a" * 40, files[record_path].content
        )
        _, result = b2_notify.validate_notification(issue, fetch, now=NOW)
        self.assertEqual(result.reason_code, "NOTIFICATION_RECORD_SHA_MISMATCH")

        issue, fetch, files = fixture()
        handoff_path = "docs/handoffs/008/EXECUTION_INSTRUCTION.md"
        files[handoff_path] = dispatch_inbox.FileSnapshot(
            handoff_path, "b" * 40, files[handoff_path].content
        )
        _, result = b2_notify.validate_notification(issue, fetch, now=NOW)
        self.assertEqual(result.reason_code, "HANDOFF_SHA_MISMATCH")

    def test_matrix_05_missing_ambiguous_expired_cancelled_fail_closed(self):
        issue, fetch, _ = fixture(issue_overrides={"body": "no envelope"})
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "ENVELOPE_MISSING_OR_MULTIPLE",
        )
        issue, fetch, _ = fixture()
        issue["body"] += issue["body"]
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "ENVELOPE_MISSING_OR_MULTIPLE",
        )
        issue, fetch, _ = fixture()
        self.assertEqual(
            b2_notify.validate_notification(
                issue, fetch, now=dt.datetime(2031, 1, 1, tzinfo=dt.timezone.utc)
            )[1].reason_code,
            "NOTIFICATION_EXPIRED",
        )
        issue, fetch, _ = fixture(
            issue_overrides={"labels": [{"name": "dispatch:approved"}, {"name": "dispatch:cancelled"}]}
        )
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "NOTIFICATION_CANCELLED",
        )

    def test_matrix_06_wrong_module_and_changed_sha_are_rejected(self):
        issue, fetch, _ = fixture(envelope_overrides={"module": "999"})
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "MODULE_NOT_ALLOWED",
        )
        issue, fetch, _ = fixture(envelope_overrides={"handoff_blob_sha": "c" * 40})
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "AUTHORIZATION_RECORD_MISMATCH",
        )
        issue, fetch, _ = fixture(
            envelope_overrides={"handoff_path": "docs/handoffs/007/EXECUTION_INSTRUCTION.md"}
        )
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "HANDOFF_MODULE_MISMATCH",
        )

    def test_matrix_07_module_008_notification_is_not_implementation_authorization(self):
        message = b2_notify.compose_message(authorized_notification())
        self.assertIn("Module implementation status: BLOCKED", message)
        self.assertIn("does not authorize implementation", message)

    def test_matrix_08_untrusted_issue_text_never_reaches_message(self):
        issue, fetch, _ = fixture()
        notification, _ = b2_notify.validate_notification(issue, fetch, now=NOW)
        self.assertIsNotNone(notification)
        message = b2_notify.compose_message(notification)
        self.assertNotIn("rm", message)
        self.assertNotIn("evil.invalid", message)
        self.assertNotIn("More untrusted prose", message)

    def test_bounded_body_and_unknown_fields_fail_closed(self):
        issue, fetch, _ = fixture(issue_overrides={"body": "x" * (b2_notify.MAX_BODY_BYTES + 1)})
        self.assertEqual(b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code, "BODY_INVALID")
        issue, fetch, _ = fixture()
        body = issue["body"].replace('"schema_version": 2', '"extra": true, "schema_version": 2')
        issue["body"] = body
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "SCHEMA_FIELDS_MISMATCH",
        )

    def test_duplicate_json_fields_fail_closed_in_issue_and_record(self):
        issue, fetch, _ = fixture()
        issue["body"] = issue["body"].replace(
            '"dispatch_id": "PWS-B2-TEST-001"',
            '"dispatch_id": "PWS-B2-TEST-001", "dispatch_id": "PWS-B2-TEST-001"',
            1,
        )
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "DUPLICATE_FIELDS",
        )

        issue, fetch, files = fixture()
        record_path = "docs/dispatch/notifications/PWS-B2-TEST-001.md"
        snapshot = files[record_path]
        content = snapshot.content.replace(
            '"nonce": "NONCE_1234567890ABCDEF"',
            '"nonce": "NONCE_1234567890ABCDEF", "nonce": "NONCE_1234567890ABCDEF"',
        )
        files[record_path] = dispatch_inbox.FileSnapshot(record_path, snapshot.blob_sha, content)
        self.assertEqual(
            b2_notify.validate_notification(issue, fetch, now=NOW)[1].reason_code,
            "DUPLICATE_FIELDS",
        )

    def test_synthetic_policy_fixture_cases(self):
        fixture_path = ROOT / "fixtures" / "b2a-policy-cases.json"
        data = json.loads(fixture_path.read_text(encoding="utf-8"))
        self.assertIs(data["fixture_only"], True)
        self.assertIs(data["live_authorization"], False)
        for case in data["cases"]:
            with self.subTest(case=case["name"]):
                issue, fetch, _ = fixture(
                    envelope_overrides=case.get("envelope_overrides"),
                    issue_overrides=case.get("issue_overrides"),
                )
                result = b2_notify.validate_notification(issue, fetch, now=NOW)[1]
                self.assertEqual(result.reason_code, case["expected_reason"])


class RuntimeMatrixTests(unittest.TestCase):
    def test_matrix_09_uuid_remains_local_and_public_results_do_not_leak_it(self):
        notification = authorized_notification()
        public = json.dumps(
            b2_notify.NotifyResult(
                "QUEUE_SUBMITTED", "QUEUE_EXIT_ZERO_NOT_ACK", 8001, notification.dispatch_id
            ).as_public_dict()
        )
        self.assertNotIn(THREAD_UUID, public)
        with tempfile.TemporaryDirectory() as directory:
            store = b2_notify.OutboxStore(Path(directory) / "state.json")
            store.prepare(notification)
            self.assertNotIn(THREAD_UUID, (Path(directory) / "state.json").read_text("utf-8"))

    def test_matrix_10_invalid_or_missing_target_blocks_without_guessing(self):
        with tempfile.TemporaryDirectory() as directory:
            config = local_config(Path(directory), thread_uuid="not-a-uuid")
            with self.assertRaises(b2_notify.B2Error) as error:
                config.validate_runtime()
            self.assertEqual(error.exception.code, "THREAD_UUID_INVALID")
        source = Path(b2_notify.__file__).read_text("utf-8")
        self.assertNotIn('"--last"', source)
        self.assertNotIn('"--resume"', source)

    def test_matrix_11_command_is_fixed_argument_array_and_shell_false(self):
        with tempfile.TemporaryDirectory() as directory:
            config = local_config(Path(directory))
            calls = []

            def runner(command, **kwargs):
                calls.append((command, kwargs))
                return subprocess.CompletedProcess(command, 0, b"queued", b"")

            b2_notify.CodexQueueSender(runner=runner).submit(config, "fixed message")
            command, kwargs = calls[0]
            self.assertEqual(command[1:3], ["queue", "--thread"])
            self.assertEqual(command[3], THREAD_UUID)
            self.assertEqual(command[4:], ["--message", "fixed message"])
            self.assertIs(kwargs["shell"], False)
            self.assertIs(kwargs["text"], False)

    def test_matrix_12_queue_exit_zero_is_submitted_never_ack_verified(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = local_config(root)
            sender = b2_notify.CodexQueueSender(
                runner=lambda command, **kwargs: subprocess.CompletedProcess(command, 0, b"", b"")
            )
            result = b2_notify.attempt_notification(
                authorized_notification(),
                config,
                b2_notify.OutboxStore(root / "state.json"),
                b2_notify.OneInstanceLock(root / "lock"),
                sender,
            )
            self.assertEqual(result.status, "QUEUE_SUBMITTED")
            self.assertEqual(result.reason_code, "QUEUE_EXIT_ZERO_NOT_ACK")

    def test_matrix_13_exact_ack_only_records_reported_never_verified(self):
        notification = authorized_notification()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            store = b2_notify.OutboxStore(root / "state.json")
            store.prepare(notification)
            store.transition(notification.dedupe_key, "QUEUE_SUBMITTED", "QUEUE_EXIT_ZERO")
            self.assertFalse(store.record_ack_reported(notification, "almost"))
            self.assertTrue(store.record_ack_reported(notification, notification.expected_ack))
            state = json.loads((root / "state.json").read_text("utf-8"))
            self.assertEqual(state["entries"][notification.dedupe_key]["status"], "ACK_REPORTED")
            self.assertNotIn("ACK_VERIFIED", (root / "state.json").read_text("utf-8"))

    def test_matrix_14_duplicate_submission_is_suppressed(self):
        notification = authorized_notification()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = local_config(root)
            calls = []

            def runner(command, **kwargs):
                calls.append(command)
                return subprocess.CompletedProcess(command, 0, b"", b"")

            sender = b2_notify.CodexQueueSender(runner=runner)
            store = b2_notify.OutboxStore(root / "state.json")
            first = b2_notify.attempt_notification(
                notification, config, store, b2_notify.OneInstanceLock(root / "lock"), sender
            )
            second = b2_notify.attempt_notification(
                notification, config, store, b2_notify.OneInstanceLock(root / "lock"), sender
            )
            self.assertEqual(first.status, "QUEUE_SUBMITTED")
            self.assertEqual(second.reason_code, "DUPLICATE_SUPPRESSED")
            self.assertEqual(len(calls), 1)

    def test_matrix_15_crash_after_prepared_becomes_unknown_and_never_retries(self):
        notification = authorized_notification()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = local_config(root)
            calls = []

            def crash(command, **kwargs):
                calls.append(command)
                raise KeyboardInterrupt()

            store = b2_notify.OutboxStore(root / "state.json")
            with self.assertRaises(KeyboardInterrupt):
                b2_notify.attempt_notification(
                    notification,
                    config,
                    store,
                    b2_notify.OneInstanceLock(root / "lock"),
                    b2_notify.CodexQueueSender(runner=crash),
                )
            result = b2_notify.attempt_notification(
                notification,
                config,
                store,
                b2_notify.OneInstanceLock(root / "lock"),
                b2_notify.CodexQueueSender(runner=crash),
            )
            self.assertEqual(result.status, "UNKNOWN_DELIVERY")
            self.assertEqual(result.reason_code, "DUPLICATE_SUPPRESSED")
            self.assertEqual(len(calls), 1)

    def test_matrix_16_process_lock_prevents_second_sender(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "lock"
            with b2_notify.OneInstanceLock(path):
                with self.assertRaises(b2_notify.StateError) as error:
                    with b2_notify.OneInstanceLock(path):
                        pass
            self.assertEqual(error.exception.code, "ANOTHER_INSTANCE_ACTIVE")

    def test_matrix_17_timeout_and_non_utf8_cp936_paths_are_sanitized(self):
        with tempfile.TemporaryDirectory() as directory:
            config = local_config(Path(directory))

            def failed(command, **kwargs):
                return subprocess.CompletedProcess(command, 1, b"\xff", b"\x81\x40 thread not found")

            with self.assertRaises(b2_notify.QueueError) as error:
                b2_notify.CodexQueueSender(runner=failed).submit(config, "中文 résumé")
            self.assertEqual(error.exception.code, "SESSION_UNAVAILABLE")

            def timeout(command, **kwargs):
                raise subprocess.TimeoutExpired(command, 1)

            with self.assertRaises(b2_notify.QueueError) as error:
                b2_notify.CodexQueueSender(runner=timeout).submit(config, "fixed")
            self.assertEqual(error.exception.code, "QUEUE_TIMEOUT")

    def test_closed_session_result_is_unknown_and_not_retried(self):
        notification = authorized_notification()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = local_config(root)
            calls = []

            def unavailable(command, **kwargs):
                calls.append(command)
                return subprocess.CompletedProcess(command, 1, b"", b"thread not found")

            result = b2_notify.attempt_notification(
                notification,
                config,
                b2_notify.OutboxStore(root / "state.json"),
                b2_notify.OneInstanceLock(root / "lock"),
                b2_notify.CodexQueueSender(runner=unavailable),
            )
            self.assertEqual(result.status, "UNKNOWN_DELIVERY")
            self.assertEqual(result.reason_code, "SESSION_UNAVAILABLE")
            second = b2_notify.attempt_notification(
                notification,
                config,
                b2_notify.OutboxStore(root / "state.json"),
                b2_notify.OneInstanceLock(root / "lock"),
                b2_notify.CodexQueueSender(runner=unavailable),
            )
            self.assertEqual(second.reason_code, "DUPLICATE_SUPPRESSED")
            self.assertEqual(len(calls), 1)

    def test_matrix_18_corrupt_or_failed_state_prevents_queue(self):
        notification = authorized_notification()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = local_config(root)
            state = root / "state.json"
            state.write_text("not-json", encoding="utf-8")
            calls = []
            sender = b2_notify.CodexQueueSender(
                runner=lambda command, **kwargs: calls.append(command)
            )
            result = b2_notify.attempt_notification(
                notification,
                config,
                b2_notify.OutboxStore(state),
                b2_notify.OneInstanceLock(root / "lock"),
                sender,
            )
            self.assertEqual(result.status, "BLOCKED")
            self.assertEqual(result.reason_code, "STATE_CORRUPT")
            self.assertEqual(calls, [])

            class FailingStore(b2_notify.OutboxStore):
                def _write(self, data):
                    raise b2_notify.StateError("STATE_PERSIST_FAILED")

            clean_state = root / "clean-state.json"
            result = b2_notify.attempt_notification(
                notification,
                config,
                FailingStore(clean_state),
                b2_notify.OneInstanceLock(root / "lock2"),
                sender,
            )
            self.assertEqual(result.reason_code, "STATE_PERSIST_FAILED")
            self.assertEqual(calls, [])

    def test_matrix_19_disabled_and_expired_before_send_block(self):
        notification = authorized_notification()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            calls = []
            sender = b2_notify.CodexQueueSender(
                runner=lambda command, **kwargs: calls.append(command)
            )
            disabled = local_config(root, enabled=False)
            result = b2_notify.attempt_notification(
                notification,
                disabled,
                b2_notify.OutboxStore(root / "state.json"),
                b2_notify.OneInstanceLock(root / "lock"),
                sender,
            )
            self.assertEqual(result.reason_code, "DELIVERY_DISABLED")
            expired = dataclasses.replace(
                notification, expires_at=dt.datetime(2020, 1, 1, tzinfo=dt.timezone.utc)
            )
            enabled = local_config(root)
            result = b2_notify.attempt_notification(
                expired,
                enabled,
                b2_notify.OutboxStore(root / "state2.json"),
                b2_notify.OneInstanceLock(root / "lock2"),
                sender,
                now=NOW,
            )
            self.assertEqual(result.reason_code, "NOTIFICATION_EXPIRED")
            self.assertEqual(calls, [])

    def test_matrix_20_and_21_no_github_write_or_background_install(self):
        source = Path(b2_notify.__file__).read_text("utf-8").casefold()
        for forbidden in ("--method post", "git push", "task scheduler", "schtasks", "start-service"):
            self.assertNotIn(forbidden, source)

    def test_matrix_22_no_module_source_side_effect_and_message_forbids_work(self):
        source = Path(b2_notify.__file__).read_text("utf-8")
        message = b2_notify.compose_message(authorized_notification())
        self.assertNotIn("features.research", source)
        self.assertIn("Do not edit files", message)
        self.assertIn("start Module 007/008", message)

    def test_matrix_23_mocked_end_to_end_is_deterministic(self):
        notification = authorized_notification()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = local_config(root)
            runner = mock.Mock(
                return_value=subprocess.CompletedProcess(["codex"], 0, b"queued", b"")
            )
            result = b2_notify.attempt_notification(
                notification,
                config,
                b2_notify.OutboxStore(root / "state.json"),
                b2_notify.OneInstanceLock(root / "lock"),
                b2_notify.CodexQueueSender(runner=runner),
            )
            self.assertEqual(result.status, "QUEUE_SUBMITTED")
            self.assertEqual(runner.call_count, 1)
            self.assertEqual(json.loads(json.dumps(result.as_public_dict()))["reason_code"], "QUEUE_EXIT_ZERO_NOT_ACK")

    def test_matrix_24_live_ack_is_not_fabricated_by_code_qa(self):
        source = Path(b2_notify.__file__).read_text("utf-8")
        self.assertNotIn('transition(notification.dedupe_key, "ACK_VERIFIED"', source)
        self.assertIn("ACK_REPORTED", source)
        notification = authorized_notification()
        with tempfile.TemporaryDirectory() as directory:
            store = b2_notify.OutboxStore(Path(directory) / "state.json")
            store.prepare(notification)
            with self.assertRaises(b2_notify.StateError) as error:
                store.transition(notification.dedupe_key, "ACK_VERIFIED", "UNPROVEN")
            self.assertEqual(error.exception.code, "ACK_VERIFICATION_SOURCE_UNAVAILABLE")

    def test_default_cli_is_disabled_before_config_or_queue(self):
        with mock.patch.object(b2_notify.LocalConfig, "load") as load:
            self.assertEqual(b2_notify.main([]), 64)
            load.assert_not_called()

    def test_local_config_strictly_rejects_unknown_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.json"
            path.write_text(json.dumps({"version": 1, "extra": True}), encoding="utf-8")
            with self.assertRaises(b2_notify.B2Error) as error:
                b2_notify.LocalConfig.load(path)
            self.assertEqual(error.exception.code, "CONFIG_INVALID")

    def test_rev01_local_config_version_requires_actual_integer_one(self):
        base = {
            "version": 1,
            "dispatch_enabled": False,
            "notification_only": True,
            "repository": "zyyu1/personal-workspace",
            "expected_author": "zyyu1",
            "expected_user": getpass.getuser(),
            "thread_uuid": THREAD_UUID,
            "codex_executable": "C:/Program Files/OpenAI/codex.exe",
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.json"
            for value in [True, False, 1.0, "1", None, 0, -1]:
                with self.subTest(value=value):
                    payload = dict(base, version=value)
                    path.write_text(json.dumps(payload), encoding="utf-8")
                    with self.assertRaises(b2_notify.B2Error) as error:
                        b2_notify.LocalConfig.load(path)
                    self.assertEqual(error.exception.code, "CONFIG_INVALID")
            path.write_text(json.dumps(base), encoding="utf-8")
            self.assertEqual(b2_notify.LocalConfig.load(path).dispatch_enabled, False)

    def test_rev01_local_config_flags_and_identity_fields_require_exact_types(self):
        base = {
            "version": 1,
            "dispatch_enabled": False,
            "notification_only": True,
            "repository": "zyyu1/personal-workspace",
            "expected_author": "zyyu1",
            "expected_user": getpass.getuser(),
            "thread_uuid": THREAD_UUID,
            "codex_executable": "C:/Program Files/OpenAI/codex.exe",
        }
        invalid = {
            "dispatch_enabled": 0,
            "notification_only": 1,
            "repository": None,
            "expected_author": True,
            "expected_user": 1.0,
            "thread_uuid": [],
            "codex_executable": 7,
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.json"
            for field, value in invalid.items():
                with self.subTest(field=field, value=value):
                    path.write_text(json.dumps(dict(base, **{field: value})), encoding="utf-8")
                    with self.assertRaises(b2_notify.B2Error) as error:
                        b2_notify.LocalConfig.load(path)
                    self.assertEqual(error.exception.code, "CONFIG_INVALID")


if __name__ == "__main__":
    unittest.main()
