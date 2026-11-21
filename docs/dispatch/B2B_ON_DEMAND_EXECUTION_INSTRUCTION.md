# Personal Workspace — B2B V1.1 On-Demand Bridge: CODE-ONLY Execution Instruction

**Status:** IMPLEMENTATION AUTHORIZED FOR CODE + MOCK TESTS + INDEPENDENT REVIEW ONLY — 2026-11-21
**Work owner:** Existing Windows Codex Development Window
**Repository:** `zyyu1/personal-workspace` (private)
**Authority:** `docs/dispatch/B2B_ON_DEMAND_DESIGN_APPROVED.md` on `main` — user-approved V1.1, not the historical Task Scheduler design
**Phase:** B2B *on-demand* notification receiver; do NOT implement unattended polling.
**Host installation:** NOT AUTHORIZED.
**Actual `codex queue`:** NOT AUTHORIZED.
**Automatic B3 coding:** NOT AUTHORIZED.

> The user explicitly rejected background polling and confirmed a one-click, on-demand workflow: **do nothing unless the user deliberately requests a local receive; start one short-lived Windows process, read one approved GitHub notification, submit at most once to the original pinned Codex conversation, exit**. Publishing this Issue or document is not a remote wakeup or permission to execute code automatically.

## 0. Mandatory preflight and GitHub OSS research

1. Read `docs/dispatch/B2B_ON_DEMAND_DESIGN_APPROVED.md`, `docs/dispatch/B2_STATUS.md`, `docs/dispatch/B2_DESIGN_APPROVED.md`, `tools/dispatch-inbox/README.md`, the complete existing B1/B2A implementation and accepted B2A one-shot ACK evidence (Issue #10).
2. Verify fresh `main` and a clean/safely preserved local checkout. New implementation branch exactly `codex/dispatch-b2b-on-demand` based on current `origin/main`. No reset, clean, force push, rebase over someone else's work, or unrelated code changes. Record base and new candidate HEAD.
3. Before code changes, inspect 3 relevant public GitHub projects, reporting **stars, latest commit date, license, stack, Windows deployment complexity, reusable interfaces, adaptation cost and risks, URLs**:
   - https://github.com/openai/codex (official queue interface; reuse installed CLI only; do not fork)
   - https://github.com/cli/cli (official `gh api` GET interface)
   - https://github.com/songyb111-gachon/codex-auto-resume-windows (Windows operational reference only, not an installed dependency or reason to auto-resume a session)
4. Confirm `codex queue --help` **read-only** on the actual host if possible; never send a real message during implementation/QA.

## 1. Authorized implementation scope

Implement minimal user-initiated B2B bridge tooling, ideally under `tools/dispatch-inbox/`, with **no change to existing B1/B2A default CLI behavior**:

- One finite, bounded single-invocation receiver; may re-use `dispatch_inbox.py` GET adapter and `b2_notify.py` strict v2 validator, local config, `OutboxStore`, `OneInstanceLock`, `CodexQueueSender` and safe message renderer; **no duplicate weak authorization parser**.
- A proposed local **Receive Personal Workspace Task** Windows shortcut/launcher *template*, checked into the repository only as a source template / manual setup guide. It must be **inert** until an operator separately approves installation. No shortcut creation/registration or mutation of live Windows user folders during coding or QA.
- Explicit per-invocation opt-in. Keep both `dispatch_enabled=false` by default and a command-line/on-click consent gate; avoid permanent `dispatch_enabled=true` between invocations. Any proposed temporary consent must be provably reversible on failures/restarts and cannot silently bypass B2A security. If a design change is required, **stop and escalate**, do not weaken B2A to make the shortcut easy to use.
- Exactly one GET-only inbox scan per activation, with bounded pagination and timeout; zero approved => safe no-action, more than one approved => block without choosing arbitrarily, one approved => strict validation, acquire lock, recheck current authorization, durable `PREPARED` before one safe submit, exit. Review the existing B2A launcher carefully: it currently lists candidates before entering `attempt_notification`; newly required fresh revalidation under lock must be explicit, tested and fail-closed.
- `mode=probe|notify` only; `mode=implement` always blocked. GitHub Issue must never be copied verbatim into the prompt; safe fixed text only. Don't permit arbitrary GitHub-supplied commands/flags, file paths, URLs or template variations.
- One exact locally pinned original Codex Desktop thread UUID and pinned verified local official binary, current non-admin Windows user, no `--resume`, `--last`, new sessions or undocumented Codex database access.
- Dedupe across repeated clicks/processes: local `PREPARED`/ `QUEUE_SUBMITTED`/ `UNKNOWN_DELIVERY` suppress auto-resend. Preserve existing B2A outbox history including consumed Issue #10. State/ACL/lock/auth/network failures stop safely.
- Process emits sanitized status `NO_ACTION / BLOCKED / QUEUE_SUBMITTED (NOT ACK) / UNKNOWN_DELIVERY`; exits immediately after one finite run. Never label a queue result `ACK_VERIFIED`.
- Optional user-local rollback/uninstall instructions **only**; no installer actually run without separate host authorization.

**No code in** `src/`, Modules 007/008, frozen B2/B2B design files, GitHub credentials, remote APIs, Windows machine scheduler/service, or other projects. Do not create live GitHub notification Issues/authorization records. Do not modify B1's existing `--once --dry-run` or erase its read-only receipts.

## 2. Absolute prohibitions

- No Windows Task Scheduler, `schtasks`, Task Scheduler API, Windows Service, SYSTEM task, daemon, foreground endless watcher, poll loop, auto-logon, Windows Startup folder, registry Run key, remote desktop wakeup, local HTTP server, inbound network port or remote-control tunnel.
- No automatic timer, retry, silent process persisting after a click or background connection.
- No local shortcut `lnk` installation/creation on the user's actual desktop or any modifications to live user config/Outbox as a side effect of development/QA.
- No real `codex queue` message from actual host during development or code QA — fake/injected sender only. A future one-time pilot requires an explicit **new** Design Window instruction.
- No reopen/reapproval of consumed Issue #10, no reset/replay of local outbox, no new queue probe without separate permission.
- No GitHub writes in receiver (no issue comments, labels, state changes, branch pushes, merges), no broad new token scope.
- No autonomous implementation/B3; do not execute the referenced handoff or start Module 007/008.

## 3. Security acceptance and required QA

Implement tests covering the **28 QA checks** in `B2B_ON_DEMAND_DESIGN_APPROVED.md`, especially:
1. No long-lived task or scheduled runner; launcher does not start until explicit user action; exits after one bounded scan.
2. Default disabled; per-run consent; wrong user/session/CLI path blocks; never persists a globally enabled state accidentally. If an actual Windows shortcut template needs an interpreter with complex quoting, tests must validate Windows-safe argument parsing and fixed executable binding.
3. Original strict v2 field types and authorization record/Handoff blob identity stay intact; denied implement mode, forged label/account, expiry/cancellation, `cp936`, rate limits, host offline and GitHub errors never reach sender.
4. Explicit **fresh recheck under the lock** immediately before PREPARED; cancellation/expiry or changed blob between scan and send blocks, even when the first scan passed.
5. Exactly one active candidate; zero => no send, >1 => block; repeated clicks, concurrency and crash after PREPARED cannot duplicate send.
6. Outbox corruption/permission/disk failure and missing/stale lock all fail closed; process exit codes and error messages sanitized.
7. `QUEUE_SUBMITTED` is not delivery/ACK; verify exact original-thread ACK is manually observed only in the separate future real-host pilot.
8. B1 47 + B2A 38 baseline Python tests stay passing; Workspace 104 tests baseline, compile, typecheck, lint, build, `git diff --check` report **actual command outputs**.
9. Mandatory check that **no actual `codex queue` was called** and no B2B shortcut/scheduler/daemon was installed; no Modules 007/008 edits.

At **code QA** stage, real Windows host installation/pilot (§28 of matrix) must remain **NOT VERIFIED** and not be fabricated PASS. Independent QA may accept code without host smoke only if there are no code/safety blockers. Any High safety issue is REJECTED until a scoped repair is separately approved by Design Window.

## 4. Deliverables and stop point

- Code/tests/fixtures/README and an inert, auditable Windows launcher **template** (not installed); provide explicit instructions for future operator-only setup, disable, cleanup and preserving dedupe Outbox.
- `tools/dispatch-inbox/B2B_ON_DEMAND_QA_HANDOFF.md`: accepted base/HEAD SHA, changed file list, code design, state machine, threat scenarios, 28-item QA matrix, actual tests and exit codes, scope boundaries and **LIVE QUEUE NOT RUN / LOCAL SHORTCUT NOT INSTALLED**.
- New **OPEN / UNMERGED** PR for `codex/dispatch-b2b-on-demand` into `main`; Independent Review Only QA rechecks PR diff, B1/B2A regression and 28 matrix rows. Return reviewed exact HEAD, PR and QA comment URL to Design Window.
- **STOP and await Design Window acceptance.** The QA window cannot merge, enable or live-send the on-demand receiver; Design Window decides code merge and subsequently a **separately authorized disabled-only host staging** and new one-shot live pilot.

**End state:** B2B V1.1 on-demand receiver source code built/tested and ready for independent QA; no active Windows process, no shortcut installed, no service, no scheduled trigger and no automatic Codex execution.
