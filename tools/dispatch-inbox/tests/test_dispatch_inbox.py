from __future__ import annotations

import datetime as dt
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("dispatch_inbox", ROOT / "dispatch_inbox.py")
assert SPEC and SPEC.loader
dispatch_inbox = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = dispatch_inbox
SPEC.loader.exec_module(dispatch_inbox)


NOW = dt.datetime(2026, 11, 21, 12, 0, tzinfo=dt.timezone.utc)
HANDOFF_PATH = "docs/dispatch/B1_EXECUTION_INSTRUCTION.md"
HANDOFF_SHA = "a" * 40
AUTHORIZED = "# Execution Instruction\nStatus: APPROVED\nImplementation: AUTHORIZED"


def envelope(**overrides):
    value = {
        "schema_version": 1,
        "dispatch_id": "FLOW-TEST-0001",
        "mode": "notify",
        "module": "dispatch-b1",
        "repo": "zyyu1/personal-workspace",
        "handoff_path": HANDOFF_PATH,
        "handoff_blob_sha": HANDOFF_SHA,
        "created_by": "zyyu1",
        "expires_at": "2026-11-22T12:00:00Z",
        "requires_human_approval": True,
        "gate_status": "READY",
    }
    value.update(overrides)
    return value


def issue(env=None, **overrides):
    body = "```dispatch\n" + json.dumps(env or envelope()) + "\n```"
    value = {
        "number": 42,
        "state": "open",
        "repository_full_name": "zyyu1/personal-workspace",
        "user": {"login": "zyyu1"},
        "labels": [{"name": "dispatch:approved"}],
        "body": body,
    }
    value.update(overrides)
    return value


def fetcher(path):
    if path == "docs/handoffs/007/STATUS.md":
        return dispatch_inbox.FileSnapshot(path, "b" * 40, "QA: PENDING")
    return dispatch_inbox.FileSnapshot(path, HANDOFF_SHA, AUTHORIZED)


class ClassificationTests(unittest.TestCase):
    def classify(self, value):
        return dispatch_inbox.classify_issue(value, fetcher, now=NOW)

    def test_valid_fixture_is_eligible_dry_run(self):
        result = self.classify(issue())
        self.assertEqual(result.classification, "ELIGIBLE_DRY_RUN")
        self.assertEqual(result.reason_code, "VALIDATED_DRY_RUN_ONLY")

    def test_wrong_account_rejected(self):
        result = self.classify(issue(user={"login": "attacker"}))
        self.assertEqual((result.classification, result.reason_code), ("REJECTED_UNTRUSTED", "AUTHOR_NOT_ALLOWED"))

    def test_missing_label_rejected(self):
        result = self.classify(issue(labels=[]))
        self.assertEqual(result.reason_code, "APPROVAL_LABEL_MISSING")

    def test_unknown_mode_rejected(self):
        result = self.classify(issue(envelope(mode="shell")))
        self.assertEqual(result.reason_code, "MODE_NOT_ALLOWED")

    def test_extra_field_rejected(self):
        env = envelope()
        env["command"] = "anything"
        result = self.classify(issue(env))
        self.assertEqual(result.reason_code, "SCHEMA_FIELDS_MISMATCH")

    def test_unsafe_path_rejected(self):
        result = self.classify(issue(envelope(handoff_path="../../secret.md")))
        self.assertEqual(result.reason_code, "HANDOFF_PATH_UNSAFE")

    def test_external_url_rejected(self):
        result = self.classify(issue(envelope(handoff_path="https://example.com/task.md")))
        self.assertEqual(result.reason_code, "HANDOFF_PATH_UNSAFE")

    def test_blob_mismatch_rejected(self):
        result = self.classify(issue(envelope(handoff_blob_sha="c" * 40)))
        self.assertEqual(result.reason_code, "HANDOFF_BLOB_MISMATCH")

    def test_expired_request_rejected(self):
        result = self.classify(issue(envelope(expires_at="2026-11-20T12:00:00Z")))
        self.assertEqual(result.reason_code, "REQUEST_EXPIRED_OR_INVALID")

    def test_008_implementation_blocked_while_007_pending(self):
        env = envelope(mode="implement", module="008")
        result = self.classify(issue(env))
        self.assertEqual((result.classification, result.reason_code), ("BLOCKED_GATE", "MODULE_008_BLOCKED_BY_007_QA"))

    def test_implementation_requires_human_approval(self):
        result = self.classify(issue(envelope(mode="implement", requires_human_approval=False)))
        self.assertEqual(result.reason_code, "HUMAN_APPROVAL_REQUIRED")

    def test_non_main_snapshot_rejected(self):
        def wrong_ref(path):
            return dispatch_inbox.FileSnapshot(path, HANDOFF_SHA, AUTHORIZED, "feature")
        result = dispatch_inbox.classify_issue(issue(), wrong_ref, now=NOW)
        self.assertEqual(result.reason_code, "AUTHORITATIVE_REF_MISMATCH")

    def test_unsigned_authorization_blocked(self):
        def unsigned(path):
            return dispatch_inbox.FileSnapshot(path, HANDOFF_SHA, "Status: DRAFT / NOT AUTHORIZED")
        result = dispatch_inbox.classify_issue(issue(), unsigned, now=NOW)
        self.assertEqual((result.classification, result.reason_code), ("BLOCKED_GATE", "AUTHORIZATION_RECORD_MISSING"))

    def test_malformed_json_rejected(self):
        value = issue()
        value["body"] = "```dispatch\n{not-json}\n```"
        self.assertEqual(self.classify(value).reason_code, "ENVELOPE_MALFORMED")


class ReceiptTests(unittest.TestCase):
    def test_duplicate_issue_and_dispatch_id_is_marked(self):
        with tempfile.TemporaryDirectory() as directory:
            store = dispatch_inbox.ReceiptStore(Path(directory) / "receipts.json")
            first = dispatch_inbox.process_issues([issue()], fetcher, store, now=NOW)[0]
            second = dispatch_inbox.process_issues([issue()], fetcher, store, now=NOW)[0]
            self.assertFalse(first.duplicate)
            self.assertTrue(second.duplicate)
            data = json.loads((Path(directory) / "receipts.json").read_text(encoding="utf-8"))
            self.assertEqual(len(data["entries"]), 1)

    def test_receipts_can_be_disabled(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "receipts.json"
            store = dispatch_inbox.ReceiptStore(path, enabled=False)
            result = store.record(dispatch_inbox.classify_issue(issue(), fetcher, now=NOW))
            self.assertFalse(result.duplicate)
            self.assertFalse(path.exists())


class AdapterTests(unittest.TestCase):
    def test_missing_gh_is_unavailable(self):
        client = dispatch_inbox.GhApiClient(retries=0)
        client.executable = None
        with self.assertRaises(dispatch_inbox.AdapterUnavailable) as error:
            client.ensure_available()
        self.assertEqual(error.exception.code, "GH_NOT_INSTALLED")

    def test_timeout_is_bounded_unavailable(self):
        def timeout(*args, **kwargs):
            raise subprocess.TimeoutExpired(args[0], kwargs["timeout"])
        client = dispatch_inbox.GhApiClient(runner=timeout, retries=0, timeout_seconds=1)
        client.executable = "gh"
        with self.assertRaises(dispatch_inbox.AdapterUnavailable) as error:
            client._run(["api", "--method", "GET", "repos/x/y/issues"])
        self.assertEqual(error.exception.code, "GH_TIMEOUT")

    def test_rate_limit_has_distinct_sanitized_code(self):
        def limited(command, **kwargs):
            return subprocess.CompletedProcess(command, 1, "", "HTTP 429: API rate limit exceeded")
        client = dispatch_inbox.GhApiClient(runner=limited, retries=0)
        client.executable = "gh"
        with self.assertRaises(dispatch_inbox.AdapterUnavailable) as error:
            client._run(["api", "--method", "GET", "repos/x/y/issues"])
        self.assertEqual(error.exception.code, "GH_RATE_LIMITED")

    def test_bounded_paging_and_read_only_methods(self):
        calls = []
        def runner(command, **kwargs):
            calls.append(command)
            if command[1:3] == ["auth", "status"]:
                return subprocess.CompletedProcess(command, 0, "", "")
            page = "page=1" if "page=1" in command[-1] else "page=2"
            count = 2 if page == "page=1" else 0
            return subprocess.CompletedProcess(command, 0, json.dumps([{"number": i} for i in range(count)]), "")
        client = dispatch_inbox.GhApiClient(runner=runner, retries=0, max_pages=2, per_page=2)
        client.executable = "gh"
        client.list_open_issues()
        api_calls = [call for call in calls if "api" in call]
        self.assertEqual(len(api_calls), 2)
        self.assertTrue(all("GET" in call for call in api_calls))
        self.assertTrue(all(not any(word in call for word in ["POST", "PATCH", "DELETE"]) for call in api_calls))

    def test_no_codex_subprocess_is_constructed(self):
        calls = []
        def runner(command, **kwargs):
            calls.append(command)
            return subprocess.CompletedProcess(command, 0, "[]", "")
        client = dispatch_inbox.GhApiClient(runner=runner, retries=0)
        client.executable = "gh"
        client.list_open_issues()
        self.assertTrue(calls)
        self.assertTrue(all(Path(call[0]).name.lower() in {"gh", "gh.exe"} for call in calls))
        self.assertTrue(all("codex" not in " ".join(call).lower() for call in calls))

    def test_full_final_page_fails_closed(self):
        def runner(command, **kwargs):
            if command[1:3] == ["auth", "status"]:
                return subprocess.CompletedProcess(command, 0, "", "")
            return subprocess.CompletedProcess(command, 0, json.dumps([{"number": 1}]), "")
        client = dispatch_inbox.GhApiClient(runner=runner, retries=0, max_pages=1, per_page=1)
        client.executable = "gh"
        with self.assertRaises(dispatch_inbox.AdapterUnavailable) as error:
            client.list_open_issues()
        self.assertEqual(error.exception.code, "GH_PAGE_LIMIT_REACHED")


class CliTests(unittest.TestCase):
    def test_dry_run_flags_are_mandatory(self):
        self.assertEqual(dispatch_inbox.main([]), 64)

    def test_fixture_cli_has_no_github_dependency(self):
        fixture = ROOT / "fixtures" / "eligible.json"
        self.assertEqual(dispatch_inbox.main(["--once", "--dry-run", "--fixture", str(fixture), "--no-receipts"]), 0)


if __name__ == "__main__":
    unittest.main()
