from __future__ import annotations

import datetime as dt
import base64
import hashlib
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
AUTHORIZED = """# Execution Instruction
Status: IMPLEMENTATION APPROVED FOR B1 ONLY
Owner: Windows Codex Development Window
Repository: zyyu1/personal-workspace"""
MODULE_008_PATH = "docs/handoffs/008/EXECUTION_INSTRUCTION.md"
MODULE_008_SHA = "b" * 40
MODULE_007_IMPLEMENTATION_SHA = "1" * 40
MODULE_007_QA_PATH = "docs/handoffs/007/QA_RESULT.md"
MODULE_008_AUTHORIZED = """Module: 008
Status: IMPLEMENTATION AUTHORIZED
Implementation Authorization: ACTIVE"""


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
    return dispatch_inbox.FileSnapshot(path, HANDOFF_SHA, AUTHORIZED)


def module_008_envelope(**overrides):
    return envelope(
        mode="implement",
        module="008",
        handoff_path=MODULE_008_PATH,
        handoff_blob_sha=MODULE_008_SHA,
        **overrides,
    )


def gate_files(
    *,
    qa="ACCEPTED",
    accepted_sha=MODULE_007_IMPLEMENTATION_SHA,
    acceptance="ACCEPTED",
    report_sha=MODULE_007_IMPLEMENTATION_SHA,
    report_decision="ACCEPTED",
    authorization="ACTIVE",
):
    return {
        MODULE_008_PATH: dispatch_inbox.FileSnapshot(
            MODULE_008_PATH, MODULE_008_SHA, MODULE_008_AUTHORIZED
        ),
        "docs/handoffs/007/STATUS.md": dispatch_inbox.FileSnapshot(
            "docs/handoffs/007/STATUS.md",
            "c" * 40,
            "\n".join(
                [
                    "Module: 007",
                    f"Independent QA: {qa}",
                    f"Implementation Acceptance: {acceptance}",
                    f"Accepted Implementation SHA: {accepted_sha}",
                    f"Independent QA Report: {MODULE_007_QA_PATH}",
                ]
            ),
        ),
        MODULE_007_QA_PATH: dispatch_inbox.FileSnapshot(
            MODULE_007_QA_PATH,
            "d" * 40,
            "\n".join(
                [
                    "Module: 007",
                    f"QA Decision: {report_decision}",
                    f"Accepted Implementation SHA: {report_sha}",
                ]
            ),
        ),
        "docs/handoffs/008/STATUS.md": dispatch_inbox.FileSnapshot(
            "docs/handoffs/008/STATUS.md",
            "e" * 40,
            "\n".join(
                [
                    "Module: 008",
                    "Implementation: AUTHORIZED",
                    f"Implementation Authorization: {authorization}",
                ]
            ),
        ),
    }


def mapping_fetcher(files):
    def fetch(path):
        if path not in files:
            raise dispatch_inbox.AdapterUnavailable("FIXTURE_FILE_MISSING", "missing")
        return files[path]
    return fetch


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
        files = gate_files(qa="PENDING")
        result = dispatch_inbox.classify_issue(
            issue(module_008_envelope()), mapping_fetcher(files), now=NOW,
            verify_commit=lambda sha: True,
        )
        self.assertEqual((result.classification, result.reason_code), ("BLOCKED_GATE", "MODULE_007_QA_NOT_ACCEPTED"))

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
        self.assertEqual((result.classification, result.reason_code), ("BLOCKED_GATE", "AUTHORIZATION_NEGATIVE_OR_CONDITIONAL"))

    def test_markdown_canonical_authorization_is_accepted(self):
        content = """# Personal Workspace — B1 Read-Only GitHub Inbox Listener / Execution Instruction
**Status:** IMPLEMENTATION APPROVED FOR B1 ONLY — 2026-11-21
**Owner:** Windows Codex Development Window
**Repository:** `zyyu1/personal-workspace` (PRIVATE)"""
        result = dispatch_inbox.classify_issue(
            issue(), lambda path: dispatch_inbox.FileSnapshot(path, HANDOFF_SHA, content), now=NOW
        )
        self.assertEqual(result.classification, "ELIGIBLE_DRY_RUN")

    def test_adversarial_authorization_records_fail_closed(self):
        cases = [
            "Status: DRAFT\nApproval: APPROVED?\nImplementation: UNAUTHORIZED",
            "Status: NOT AUTHORIZED\nOwner: Windows Codex Development Window\nRepository: zyyu1/personal-workspace",
            "Status: UNAUTHORIZED\nOwner: Windows Codex Development Window\nRepository: zyyu1/personal-workspace",
            "Authorization: NOT AUTHORIZED\nAPPROVED only in prose.",
            "Status: APPROVED WITH CONDITIONS\nOwner: Windows Codex Development Window\nRepository: zyyu1/personal-workspace",
            "status: IMPLEMENTATION APPROVED FOR B1 ONLY\nowner: Windows Codex Development Window\nrepository: zyyu1/personal-workspace",
            "Status : IMPLEMENTATION APPROVED FOR B1 ONLY\nOwner: Windows Codex Development Window\nRepository: zyyu1/personal-workspace",
            "Module: 008\nStatus: IMPLEMENTATION AUTHORIZED\nImplementation Authorization: ACTIVE",
            "This prose says APPROVED and AUTHORIZED but defines no canonical fields.",
            "Status: DRAFT\nStatus: IMPLEMENTATION APPROVED FOR B1 ONLY\nOwner: Windows Codex Development Window\nRepository: zyyu1/personal-workspace",
            "Status: IMPLEMENTATION APPROVED FOR B1 ONLY\nImplementation: UNAUTHORIZED\nOwner: Windows Codex Development Window\nRepository: zyyu1/personal-workspace",
        ]
        for content in cases:
            with self.subTest(content=content):
                result = dispatch_inbox.classify_issue(
                    issue(), lambda path, text=content: dispatch_inbox.FileSnapshot(path, HANDOFF_SHA, text), now=NOW
                )
                self.assertNotEqual(result.classification, "ELIGIBLE_DRY_RUN")

    def test_malformed_json_rejected(self):
        value = issue()
        value["body"] = "```dispatch\n{not-json}\n```"
        self.assertEqual(self.classify(value).reason_code, "ENVELOPE_MALFORMED")


class Module008GateTests(unittest.TestCase):
    def classify(self, files, *, commit=True):
        return dispatch_inbox.classify_issue(
            issue(module_008_envelope()),
            mapping_fetcher(files),
            now=NOW,
            verify_commit=lambda sha: commit and sha == MODULE_007_IMPLEMENTATION_SHA,
        )

    def test_fully_consistent_fixture_is_eligible(self):
        self.assertEqual(self.classify(gate_files()).classification, "ELIGIBLE_DRY_RUN")

    def test_qa_accepted_without_sha_is_blocked(self):
        self.assertEqual(
            self.classify(gate_files(accepted_sha="")).reason_code,
            "MODULE_007_ACCEPTED_SHA_MISSING",
        )

    def test_malformed_sha_is_blocked(self):
        self.assertEqual(
            self.classify(gate_files(accepted_sha="not-a-sha")).reason_code,
            "MODULE_007_ACCEPTED_SHA_MISSING",
        )

    def test_fake_sha_not_in_repository_is_blocked(self):
        self.assertEqual(
            self.classify(gate_files(), commit=False).reason_code,
            "MODULE_007_COMMIT_UNVERIFIED",
        )

    def test_conflicting_qa_report_sha_is_blocked(self):
        self.assertEqual(
            self.classify(gate_files(report_sha="2" * 40)).reason_code,
            "MODULE_007_QA_EVIDENCE_MISMATCH",
        )

    def test_accepted_with_fixes_is_blocked(self):
        self.assertEqual(
            self.classify(gate_files(qa="ACCEPTED WITH FIXES")).reason_code,
            "MODULE_007_QA_NOT_ACCEPTED",
        )

    def test_a01_baseline_substitution_is_blocked(self):
        sha = dispatch_inbox.A01_BASELINE_SHA
        self.assertEqual(
            self.classify(gate_files(accepted_sha=sha, report_sha=sha)).reason_code,
            "MODULE_007_ACCEPTED_SHA_IS_A01_BASELINE",
        )

    def test_007_accepted_but_008_inactive_is_blocked(self):
        self.assertEqual(
            self.classify(gate_files(authorization="CONDITIONAL, NOT YET ACTIVE")).reason_code,
            "MODULE_008_AUTHORIZATION_INACTIVE",
        )

    def test_wrong_status_module_is_blocked(self):
        files = gate_files()
        files["docs/handoffs/007/STATUS.md"] = dispatch_inbox.FileSnapshot(
            "docs/handoffs/007/STATUS.md", "c" * 40,
            files["docs/handoffs/007/STATUS.md"].content.replace("Module: 007", "Module: 008"),
        )
        self.assertEqual(self.classify(files).reason_code, "MODULE_007_ID_MISMATCH")

    def test_non_main_gate_evidence_is_blocked(self):
        files = gate_files()
        original = files["docs/handoffs/007/STATUS.md"]
        files["docs/handoffs/007/STATUS.md"] = dispatch_inbox.FileSnapshot(
            original.path, original.blob_sha, original.content, "feature"
        )
        self.assertEqual(self.classify(files).reason_code, "MODULE_007_STATUS_INVALID")


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
    @staticmethod
    def file_client(content, *, encoding="base64", sha=None, path=HANDOFF_PATH):
        raw = content if isinstance(content, bytes) else content.encode("utf-8")
        payload = {
            "type": "file",
            "path": path,
            "encoding": encoding,
            "sha": sha or hashlib.sha1(f"blob {len(raw)}\0".encode("ascii") + raw).hexdigest(),
            "content": base64.b64encode(raw).decode("ascii"),
        }
        def runner(command, **kwargs):
            return subprocess.CompletedProcess(command, 0, json.dumps(payload), "")
        client = dispatch_inbox.GhApiClient(runner=runner, retries=0)
        client.executable = "gh"
        return client, payload

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

    def test_github_wrapped_base64_lf_and_crlf_are_accepted(self):
        for separator in ["\n", "\r\n"]:
            with self.subTest(separator=repr(separator)):
                client, payload = self.file_client(AUTHORIZED)
                value = payload["content"]
                payload["content"] = separator.join(value[index:index + 12] for index in range(0, len(value), 12))
                snapshot = client.fetch_file(HANDOFF_PATH)
                self.assertEqual(snapshot.content, AUTHORIZED)

    def test_unwrapped_base64_is_accepted(self):
        client, _ = self.file_client(AUTHORIZED)
        self.assertEqual(client.fetch_file(HANDOFF_PATH).content, AUTHORIZED)

    def test_github_file_payload_rejects_invalid_variants(self):
        cases = {}
        client, payload = self.file_client(AUTHORIZED)
        cases["wrong encoding"] = {**payload, "encoding": "utf-8"}
        cases["bad padding"] = {**payload, "content": payload["content"][:-1]}
        cases["invalid alphabet"] = {**payload, "content": payload["content"][:-2] + "!@"}
        cases["empty"] = {**payload, "content": ""}
        cases["wrong path"] = {**payload, "path": "docs/dispatch/OTHER.md"}
        cases["wrong sha"] = {**payload, "sha": "f" * 40}
        invalid_utf8 = b"\xff\xfe\xfd"
        invalid_sha = hashlib.sha1(f"blob {len(invalid_utf8)}\0".encode("ascii") + invalid_utf8).hexdigest()
        cases["invalid utf8"] = {
            **payload,
            "sha": invalid_sha,
            "content": base64.b64encode(invalid_utf8).decode("ascii"),
        }
        oversized = b"x" * (dispatch_inbox.MAX_FILE_BYTES + 1)
        oversized_sha = hashlib.sha1(f"blob {len(oversized)}\0".encode("ascii") + oversized).hexdigest()
        cases["oversized"] = {
            **payload,
            "sha": oversized_sha,
            "content": base64.b64encode(oversized).decode("ascii"),
        }
        for name, invalid_payload in cases.items():
            with self.subTest(name=name):
                def runner(command, **kwargs):
                    return subprocess.CompletedProcess(command, 0, json.dumps(invalid_payload), "")
                invalid_client = dispatch_inbox.GhApiClient(runner=runner, retries=0)
                invalid_client.executable = "gh"
                with self.assertRaises(dispatch_inbox.AdapterUnavailable) as error:
                    invalid_client.fetch_file(HANDOFF_PATH)
                self.assertEqual(error.exception.code, "GH_MALFORMED_RESPONSE")

    def test_commit_verification_is_read_only_and_exact(self):
        sha = MODULE_007_IMPLEMENTATION_SHA
        calls = []
        def runner(command, **kwargs):
            calls.append(command)
            return subprocess.CompletedProcess(command, 0, json.dumps({"sha": sha}), "")
        client = dispatch_inbox.GhApiClient(runner=runner, retries=0)
        client.executable = "gh"
        self.assertTrue(client.commit_exists(sha))
        self.assertIn("--method", calls[0])
        self.assertIn("GET", calls[0])


class CliTests(unittest.TestCase):
    def test_dry_run_flags_are_mandatory(self):
        self.assertEqual(dispatch_inbox.main([]), 64)

    def test_fixture_cli_has_no_github_dependency(self):
        fixture = ROOT / "fixtures" / "eligible.json"
        self.assertEqual(dispatch_inbox.main(["--once", "--dry-run", "--fixture", str(fixture), "--no-receipts"]), 0)


if __name__ == "__main__":
    unittest.main()
