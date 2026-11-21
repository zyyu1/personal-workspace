# Personal Workspace — B2A One-Time Windows Live Notification Probe

**Status:** DESIGN WINDOW AUTHORIZED FOR ONE OPERATOR-SUPERVISED NOTIFICATION ONLY — 2026-11-21
**Scope:** One `b2_notify.py --notify-once --enable-notifications` real-host invocation, exactly one pre-approved GitHub Issue, exact existing Windows Codex Desktop thread, fixed safe message, manually observed nonce ACK.
**Source:** [Issue #10](https://github.com/zyyu1/personal-workspace/issues/10) and [frozen notification authorization record](https://github.com/zyyu1/personal-workspace/blob/main/docs/dispatch/notifications/PWS-B2A-SMOKE-20261121-ISSUE10.md).
**Prior code QA:** [PR #9 accepted and merged](https://github.com/zyyu1/personal-workspace/pull/9), B2A Revision 01 QA 23 PASS / 0 FAIL / 1 NOT VERIFIED.
**Absolute expiration:** `2026-11-23T18:00:00+01:00` (Europe/Berlin). If expired or cancelled, STOP. Never edit expiry, label or SHA to get around expiry.
**No other delivery permission:** This test does NOT authorize real implementation, B2B, B3, Windows scheduled tasks, unattended listener, Module 007/008 development or merging other PRs.

## 0. Preflight: do not submit yet

1. Operator in the **existing Windows Codex execution conversation** reads this full instruction and the authoritative `main` B2 status, design and B2A README. This is the only approved live B2A notification. Do NOT use the Issue #8 implementation handoff as a test notification.
2. Observe current Windows local Git worktree and branch. Only from a safe clean checkout, `git fetch origin`, `git switch main`, `git pull --ff-only origin main`; no reset, clean, force, rebase or overwrite. Ensure current `main` includes PR #9 merge `ca68d1c1f952b3766647e2810e72483dfd5cef2c` and has `tools/dispatch-inbox/b2_notify.py`. A separate clean worktree is acceptable if existing work would otherwise be disturbed. No application source edits.
3. Confirm `py -3.13 --version`, official `gh --version`, `gh auth status -h github.com` without logging credentials; verify a read-only `gh api --method GET repos/zyyu1/personal-workspace --jq .full_name` succeeds. No package installation, new GitHub scopes or reauthentication as part of this single test.
4. Use supported Codex CLI UI/help to independently confirm the **exact B0 original existing Desktop thread UUID** is currently correct and owned by the same Windows user. Never guess or scrape unsupported databases, choose `--last`, force-resume, create a new session or print the UUID to GitHub/ChatGPT. Verify `codex queue --help` and the installed executable *without submitting a queue message*. The sender's strict absolute path rule only permits an actual verified `codex.exe` (or `codex`) file; if the installed command is merely a `.cmd` shim, symlink, renamed binary, missing or incompatible, **STOP and report**; do not bypass source checks.
5. Check original target Codex Desktop thread is open/loaded and available to receive a notification. The B0 result does not prove the thread is available at this later time. If the target is missing or cannot be verified, STOP.
6. Read the **final live Issue #10** via GitHub REST and check it is `open`, authored by `zyyu1`, has an exact `dispatch:approved` label, and contains exactly one `dispatch` JSON envelope with `mode=probe`, `module=dispatch-b2a`, `requires_human_approval=false`, pinned record SHA and pinned handoff SHA matching `main`. The record requires an exact unique nonce and expires on 2026-11-23. If labels are absent, the record does not match or API paths are unavailable, **do not create missing labels or manipulate GitHub to force authorization**; report failure to Design Window.
7. Confirm there is only **one authorized active B2A notification**. If more than one exists or the bounded GitHub client fails to list all Issues, STOP. Never run a probing workaround with altered flags/Issue bodies.

## 1. Local-only security configuration

- Keep sensitive local config **only** in `%LOCALAPPDATA%\PersonalWorkspace\dispatch-inbox\b2-notify-config.json`, not in Git or ChatGPT/GitHub comments. Current Windows user's profile should own the folder; no admin/SYSTEM account, shared folder or world-readable config.
- Contract: exact JSON keys `version=1`, `dispatch_enabled` (actual boolean), `notification_only=true`, `repository="zyyu1/personal-workspace"`, `expected_author="zyyu1"`, `expected_user=<CURRENT_WINDOWS_USER>`, `thread_uuid=<EXACT_EXISTING_SESSION_UUID>`, `codex_executable=<ABSOLUTE_VERIFIED_CODEX_EXE_PATH>`.
- **Initial value must be `dispatch_enabled=false`.** Inspect and safely validate the config locally; do not publish config content or the UUID. Only after all preflight checks PASS, set to `true` locally for exactly one manual invocation. Restore `false` immediately after, including if a queue failure or crash occurs. Do not install any autorun process.
- Use an existing user-local outbox file under the same app-data directory. Do **not** delete, truncate or reset a `PREPARED`, `QUEUE_SUBMITTED` or `UNKNOWN_DELIVERY` entry merely to repeat a test. Ensure there is no concurrent runner or stale lock; do not auto-break locks.
- No system-wide encoding workaround (`chcp`, `PYTHONUTF8`, `PYTHONIOENCODING`) or persistent PATH/config changes. If child PowerShell cannot find already installed `gh`, refreshing only process-local PATH from existing Windows user/machine PATH is allowed, as in accepted B1 host smoke.

## 2. Exactly one supervised queue attempt

From the clean repository root, after local config is explicitly enabled and all checks pass, perform exactly one invocation:

```powershell
git status --short
py -3.13 tools/dispatch-inbox/b2_notify.py --notify-once --enable-notifications
$b2aExitCode = $LASTEXITCODE
Write-Output "B2A_EXIT_CODE=$b2aExitCode"
git status --short
```

Only the **B2A code** may invoke the official `codex queue` sender once after validation; do not manually invoke queue as a second attempt. Do not paste any raw Issue prose into Codex. The safe notification should request **only**:
`PWS-B2-ACK PWS-B2A-SMOKE-20261121-ISSUE10 PWSB2A-NONCE-20261121-ISSUE10`.

Expected classifications:
- `QUEUE_SUBMITTED / QUEUE_EXIT_ZERO_NOT_ACK` with exit 0: command was accepted into queue; **NOT yet proof of delivery or ACK**.
- `BLOCKED`, `REJECTED`, `UNKNOWN_DELIVERY`, nonzero exit, missing output, timeout, loader error, wrong thread, no visible ACK, altered worktree or secret leak: report exact sanitized codes and **STOP without automatic or manual resend**.
- Successful exact ACK in the **same pre-existing Codex Desktop thread**, with evidence observed by the operator, allows recommending `B2A LIVE PROBE PASS`. Codex CLI return code alone never suffices.

After the one attempt (successful or failed):
1. Change local `dispatch_enabled` back to **false** without removing or corrupting the outbox. Verify no background service/scheduler/autostart exists.
2. Do not retry, resubmit, resume another thread or force ACK. If original thread is busy, record `QUEUE_SUBMITTED / ACK PENDING` honestly and stop; the message might appear after the busy turn.
3. Report sanitized result to Issue #10 **manually from Development Window**, not via B2A poller. Include safe host version, exact one-shot invocation and exit code, codes/UUID-redacted outbox state, whether original Desktop thread showed the exact nonce ACK, git status before/after, local config disabled again, no project writes or B2B activation. Keep tokens, full UUID, personal profile path and raw auth transcript private.
4. Stop. Design Window independently checks Issue #10 report and evidence, marks `B2A LIVE PROBE PASS / FAIL / INCONCLUSIVE`, then cancels/closes Issue #10 and removes `dispatch:approved` so it cannot be reused.

## 3. Unambiguous stage gates

- **This instruction authorizes only one harmless B2A notification submission.**
- DO NOT enable B2B continuous polling, Windows Task Scheduler, background service/daemon, GitHub write methods in poller or automatic ACK posting.
- DO NOT implement Module 007/008, start any other feature, make branches/PRs based on the notification, or automatically merge anything.
- Module 008 remains `NOT STARTED — BLOCKED BY MODULE 007 QA`.
- A real message in the existing window is **not** permission to execute a referenced Markdown handoff. Only a future separately approved B3 may consider coding dispatch.
- **If preflight fails, no live queue should run.** There is no license to bypass validation or create a new session.

**Operator expected return:** Issue #10 GitHub comment with B2A outcome and actual one-attempt evidence; return to Design Window. No further stage begins automatically.
