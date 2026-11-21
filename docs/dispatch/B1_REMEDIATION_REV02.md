# Personal Workspace — B1 Remediation Revision 02: Windows UTF-8 GitHub CLI Adapter

**Design Window decision:** REMEDIATION AUTHORIZED — B1 code fix only (2026-11-21).
**Trigger:** [Issue #4 Windows Host Verification FAIL](https://github.com/zyyu1/personal-workspace/issues/4#issuecomment-7062988330).
**Authoritative baseline:** `main` commit `699fbf4c39c21d97a41fd2b4aeb6b5acc68a1d9e` (before Revision 02).
**Impacted source:** `tools/dispatch-inbox/dispatch_inbox.py`, `GhApiClient._run` (~lines 447–480), and relevant tests/docs in `tools/dispatch-inbox/`.
**Prior QA:** B1 Revision 01 code independently QA ACCEPTED and merged with PR #5; Revision 02 is a newly discovered Windows-runtime defect, not authorization to rework prior B1 gates.
**Branch:** fresh `codex/dispatch-b1-win-encoding-rev02` from latest `origin/main`; deliver a new independent PR; do not amend or force push merged PR #5.
**Authorization:** Development + local fixture/regression tests + independent Review Only QA. **No real Windows host poll until independent QA passes and Design Window explicitly reauthorizes one-time smoke.**

## 1. Confirmed failure and objective

On Windows 10 Pro build 19045, Python 3.13.2 with system-preferred `cp936`, authenticated official `gh` 2.105.0 read the private repository successfully, but the first authorized B1 `--once --dry-run --no-receipts` poll **crashed**, exit code 1, with no classification output:

- `subprocess.run(..., text=True, capture_output=True)` tried to decode the UTF-8 `gh api` JSON stdout using Windows `cp936` and raised `UnicodeDecodeError` in the reader.
- The affected CompletedProcess/reader state could yield `stdout=None`; the adapter then called `completed.stdout.encode(...)` and raised `AttributeError`.
- The host test **FAILED**. GitHub CLI installation, official browser authentication and private-repository read GET **PASSED**. Repository working tree remained CLEAN. B2/B3 and Modules 007/008 were not started.

The remediation must make the adapter **locale-independent, fail-closed and non-crashing** when consuming `gh` outputs. Do not silently relabel the failed run as PASS.

## 2. Strict authorized changes

Modify only:
1. `tools/dispatch-inbox/dispatch_inbox.py`: subprocess decoding and null/invalid result handling inside `GhApiClient`.
2. `tools/dispatch-inbox/tests/test_dispatch_inbox.py`: targeted UTF-8, cp936, missing-stream and error-path tests; adapt existing subprocess spies without weakening assertions.
3. `tools/dispatch-inbox/README.md` / a new `B1_REV02_QA_HANDOFF.md` (or equivalent clearly named B1-specific QA handoff) for runbook, failure limitations and evidence.

Do **not** edit `src/`, any of `docs/handoffs/007/` or `008/`, frozen designs, Workspace data model, general services, Issue schema, canonical authorization parser, SHA trust controls, ZIP imports, or shared Python packages. If another path is genuinely required, STOP and ask Design Window.

### Adapter requirements

- Recommended safe implementation: capture `gh` **bytes** (`text=False` / no locale-dependent decoding), then explicitly decode successful JSON stdout with `utf-8` and strict error handling. Alternative explicit `encoding="utf-8", errors="strict"` is acceptable only if decoding exceptions and `None` are caught safely and tested; direct byte capture is preferred for clarity and byte-size limits.
- Perform `MAX_RESPONSE_BYTES` bound on **actual output bytes** before JSON decoding. Validate stdout is present and of the expected byte/string type; `returncode=0` with `stdout=None`, empty output or malformed UTF-8 must return a **sanitized B1 `UNAVAILABLE` reason** such as `GH_MALFORMED_RESPONSE`, never an uncaught exception or success.
- Decode UTF-8 JSON strictly; do not use `errors="replace"` for successful JSON. For stderr on failed commands, decoding may be best-effort and bounded for error classification; invalid/non-UTF8 stderr must never crash, be exposed raw, or become a trusted instruction. `GH_AUTH_UNAVAILABLE`, `GH_RATE_LIMITED`, `GH_FORBIDDEN`, `GH_OFFLINE`, `GH_TIMEOUT` and other existing sanitized codes must remain functional.
- Handle `subprocess.TimeoutExpired`, `OSError`, `UnicodeError`, absent stdout/stderr, invalid CompletedProcess fields and GitHub malformed responses with bounded, truthful classification. Preserve retries/timeouts, strict `shell=False`, GET-only GitHub behavior and no outward secrets.
- `gh auth status` is permitted as a prerequisite check and can have no useful stdout; do not require successful auth-check stdout. Its failure stderr must be safe to examine.
- Avoid solving this through global code-page mutation (`chcp 65001`), `PYTHONUTF8`, `PYTHONIOENCODING`, globally replacing Python I/O settings, or installing an extra dependency. The adapter itself must work under normal `cp936` and UTF-8 hosts.

## 3. Focused regression evidence (minimum)

Add unit tests proving at least:
1. `gh api` stdout UTF-8 JSON containing Chinese characters and Unicode accents decodes successfully even when Windows/Python preferred encoding is simulated as `cp936`.
2. `stdout=None`, empty stdout and malformed JSON return `GH_MALFORMED_RESPONSE` (no `AttributeError`).
3. Invalid UTF-8 JSON stdout fails closed without printing raw bytes, secrets or traceback.
4. stderr missing or non-UTF8/GBK bytes on a nonzero exit does not crash and maps to sanitized `UNAVAILABLE` reasons; recognized 401/403/429 still classify correctly.
5. Existing exact SHA, Base64 CRLF/LF, authorization fail-closed and Module 008 QA gate tests continue to pass unchanged.
6. `shell=False`, read-only `gh api --method GET`, retry limits and no Codex invocation are preserved; use test spies/static review.
7. CLI invocation `--once --dry-run --fixture ... --no-receipts` still returns expected fixture classifications.
8. No Windows environment encoding workaround is required; no new code outside scoped files.

Record actual `py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v`, `py_compile`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `git diff --check`. Do not claim PASS if not run.

## 4. Delivery and independent review

1. Verify clean local branch and `origin/main` before edits; avoid reset, clean, force push and discarded unrelated work.
2. Create new branch `codex/dispatch-b1-win-encoding-rev02` from latest `origin/main`, isolated to the authorized paths.
3. Implement the minimum fix, add focused tests, run regressions, push branch and open a **new PR** referencing this Revision 02 and Issue #4.
4. Attach a QA handoff on branch with implementation SHA, changed paths, tests and exit codes, Windows `cp936` simulation, null-output and invalid bytes evidence, no-source-writes/no-Codex/no-GitHub-write checks, known limitations.
5. Independent QA window **Review Only** must inspect actual PR code and reproduce adversarial cases. QA decision must be posted on the PR, separate from developer self-check.
6. PR must remain **OPEN / UNMERGED** until Design Window issues an explicit acceptance and merge decision.
7. **Do not rerun the real authenticated Windows `gh` poll under this development authorization.** A new one-time host smoke requires QA acceptance followed by a new Design Window instruction. Never backfill "host PASS" from unit tests.

## 5. Acceptance matrix

| # | Mandatory check |
| --- | --- |
| R02-01 | UTF-8 stdout is explicit and independent of Windows `cp936` locale |
| R02-02 | Chinese/accented JSON is accurately decoded, no silent lossy replacement |
| R02-03 | Successful process with `stdout=None`, empty, malformed JSON or invalid UTF-8 fails closed |
| R02-04 | Stderr `None` or GBK/non-UTF8 bytes fail safely and yield sanitized codes |
| R02-05 | Auth status success does not need stdout and error behavior remains bounded |
| R02-06 | Actual byte-length and file-content bounds, retries and timeouts preserved |
| R02-07 | Previous B1 strict authorization and Module 008 SHA/QA gates unaffected |
| R02-08 | GitHub Contents LF/CRLF Base64 and Git blob identity logic unaffected |
| R02-09 | GET-only GitHub API, no secret leakage, no `codex queue/exec` |
| R02-10 | No background process/service/scheduler or business module change |
| R02-11 | Python unit + compile + TypeScript typecheck + build + 104 regression tests + lint + diff evidence provided |
| R02-12 | Independent QA has reviewed new commit/PR and recorded decision; actual Windows host smoke still separately gated |

Record `PASS / PARTIAL / FAIL / NOT VERIFIED` per row.

## 6. Non-negotiable stage gates

- **B1 merged code:** accepted Revision 01 remains a historical fact; B1 **operational** status is FAIL pending R02 and a successful real Windows host smoke.
- **B2/B3:** BLOCKED, no automatic delivery, queue invocation, external chat injection or unattended monitoring.
- **Module 007:** no business-code work authorized by this Revision 02.
- **Module 008:** remains NOT STARTED / BLOCKED pending Module 007 independent QA ACCEPTED.
- **No privileged installs or auth changes:** existing `gh` is now installed and authenticated; do not reinstall or request additional scopes.

**Final deliverable:** New scoped PR + QA handoff + independent QA report. Return to Design Window for merge decision and later host smoke authorization. This revision is not permission to begin subsequent stages.
