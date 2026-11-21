# Personal Workspace — B1 Windows Host Smoke Retry, after Revision 02

**Decision:** AUTHORIZED FOR ONE CONTROLLED READ-ONLY HOST RETEST ONLY (2026-11-21).
**Purpose:** Verify the real authenticated Windows GitHub CLI JSON response works under Python `cp936` after the independently QA-accepted UTF-8 adapter fix.
**Reference:** Issue #4 https://github.com/zyyu1/personal-workspace/issues/4
**Revision 02 QA:** https://github.com/zyyu1/personal-workspace/pull/6#issuecomment-7063189705
**Design acceptance:** https://github.com/zyyu1/personal-workspace/pull/6#issuecomment-7063318650
**Merge commit:** `fad4bfb94d685111694c341fc4be10556de339f4`
**Scope:** Operator-invoked **one** real B1 authenticated inbox poll, still dry-run, no local receipts and no Codex message delivery.

## 0. Rules / prerequisites

- Use the already installed, authenticated official `gh 2.105.0`; **do not reinstall, reauthenticate, or extend scopes** unless a new actual blocker is reported and separately approved.
- Original Windows host: Windows 10 Pro 19045, Python 3.13.2, preferred encoding `cp936`.
- The B1 tool on `main` must include Revision 02. Confirm the current `main` includes `fad4bfb94d685111694c341fc4be10556de339f4` and no working tree changes are lost. `git fetch origin`, `git switch main`, `git pull --ff-only origin main` only if the checkout is clean and the operation will not interfere with ongoing work. Otherwise STOP; do not reset, clean or force. A separate clean worktree is an alternative only if safe.
- Do not change `PYTHONIOENCODING`, `PYTHONUTF8`, Windows code page, or use `chcp 65001` workaround. The purpose is to test the patched adapter with the original system encoding.
- Do not create any dispatch label, authorized task Issue or fake eligible Issue to influence the output.
- Never disclose a GitHub token, device code, session UUID, local private path, or full `gh auth status` transcript.
- No Codex queue/exec/app-server calls from this test; no B2/B3; no Windows service, scheduled task, autostart, long-lived watcher; no Module 007/008 coding.

## 1. Read-only preparation

From a normal user PowerShell window in the accepted repository:

```powershell
git status --short
git branch --show-current
git fetch origin
git switch main
git pull --ff-only origin main
git log -1 --oneline
gh --version
py -3.13 --version
gh api --method GET repos/zyyu1/personal-workspace --jq .full_name
```

Run `git switch main` and `git pull --ff-only` **only if the preceding Git state is clean and safe**. If `gh`, Python or private-repo GET is not ready, STOP and report without performing the poll. No package installs or auth changes in this stage.

## 2. Single real read-only B1 poll

At the repository root, capture the working-tree state and run **exactly one** real B1 poll:

```powershell
git status --short
py -3.13 tools/dispatch-inbox/dispatch_inbox.py --once --dry-run --no-receipts
$b1ExitCode = $LASTEXITCODE
Write-Output "B1_EXIT_CODE=$b1ExitCode"
git status --short
```

- Expected success: `B1_EXIT_CODE=0`, bounded JSON classification(s) such as `REJECTED_UNTRUSTED / APPROVAL_LABEL_MISSING` for ordinary Issues; `NO_ELIGIBLE_TASKS` is also valid for an empty Issue inbox. A zero exit and some rejected tasks is **not** implementation authorization; it only proves safe read/classification.
- `ELIGIBLE_DRY_RUN` is **not required** and cannot trigger execution in B1.
- `UNAVAILABLE`, exit 2, unexpected traceback, exit 1, hang, changed Git worktree, leaked secret or any other failure -> **STOP** and report truthful FAIL / INCONCLUSIVE, without workaround/retry.
- No `--fixture` on the real poll; `--no-receipts` prevents local receipt writes. B1 itself never writes to GitHub, never starts Codex.
- Do not infer PASS from the prior 47/47 simulated tests. This new host poll must be real.

## 3. Report and safety checks

Development Window may post a **manual** comment to Issue #4 after the run, separate from the poller. Include:

1. Host Windows/Python/`gh` versions and verified `cp936` preferred encoding (no private paths).
2. `main` HEAD commit and Revision 02 merge ancestry; clean worktree before/after.
3. Private repo `GET` PASS/FAIL; no credential content.
4. One real poll command, exact exit code, bounded summary of classifications and reason codes (redacted).
5. Whether `UnicodeDecodeError`, `AttributeError`, crash or traceback occurred. Do not paste sensitive raw output.
6. Confirm zero Codex calls, GitHub writes by poller, service/scheduler/autostart, business code edits, and no B2/B3 start.
7. Final operator recommendation: `B1 WINDOWS HOST SMOKE PASS / FAIL / INCONCLUSIVE` with evidence.

**Stop after the report.** Design Window will independently review evidence and only then decide if B1 operational gate can be marked PASS. B2 automatic dispatch requires a **separate explicit design/QA authorization** and is not enabled by this smoke. Module 008 remains BLOCKED BY MODULE 007 independent QA.
