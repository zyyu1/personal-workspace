# Personal Workspace — B2A Scoped Execution Instruction

**Status:** IMPLEMENTATION APPROVED FOR B2A CODE ONLY — 2026-11-21
**Owner:** Windows Codex Development Window
**Design:** APPROVED / FROZEN — `docs/dispatch/B2_DESIGN_APPROVED.md`
**Module:** Dispatch B2A (supervised notification-only delivery; NOT Module 007/008)
**Base:** Current accepted `main` containing B1 Revision 02 accepted code and Windows host PASS
**GitHub repository:** `zyyu1/personal-workspace` (private)
**Implementation phase:** NOT STARTED; code development may begin after Development Window explicitly reads this instruction
**LIVE DELIVERY GATE:** BLOCKED until B2A independent QA ACCEPTED and a *new, explicit Design Window authorization for one harmless real-host probe*.
**B2B / B3:** NOT AUTHORIZED.

> Design confirmation (2026-11-21) authorizes a **scoped B2A implementation PR** and independent QA. This is **NOT** consent to emit any real `codex queue` message, install an unattended listener, create a live approved dispatch Issue, or start Modules 007/008. The initial code must be disabled by default and fully testable through fixtures/mocks. The execution window receives the task in the ordinary GitHub handoff channel; **posting this instruction cannot auto-wake the Windows session before B2B exists**.

## 0. Preflight, current code, and OSS reuse

1. Read `docs/dispatch/B2_DESIGN_APPROVED.md` in full; preserve its architectural and safety decisions, particularly `1–7 and 24-point QA matrix.
2. Read B1 status and `tools/dispatch-inbox/README.md`, current B1 `dispatch_inbox.py`, accepted 47 Python tests, B0 probe and B1 independent QA/real Windows smoke evidence. Do **not** reconstruct GitHub client, authorization parser, file SHA validator or module gates in an independent copy.
3. Inspect current Git working tree and accepted `main`; preserve uncommitted files, no reset/clean/force push. Develop only on new `codex/dispatch-b2a` branch from latest `origin/main`, then open PR against `main`. Record SHA.
4. Before coding, independently check these three concrete GitHub repositories and report **stars, most recent commit, license, stack, Windows deployment difficulty, safe reuse, adaptation costs and risks**, with links:
   - https://github.com/openai/codex — official Codex CLI, Apache-2.0; use existing `codex queue` interface, not a fork.
   - https://github.com/cli/cli — official GitHub CLI, MIT; reuse authenticated `gh api` transport, no broad new token.
   - https://github.com/songyb111-gachon/codex-auto-resume-windows — MIT, Windows operational reference only, not an installed dependency.
5. Verify only the existing Windows Codex installation and official documented `codex queue --thread / --message` interface *read-only*. Use documented/help options, not undocumented database edits or UI injection. **Do not send a real message during coding or QA.**

## 1. Scope: notification-only, no code execution

Implement an isolated B2A notification-only layer, recommended `tools/dispatch-inbox/b2_notify.py` and dedicated tests/fixtures. Existing B1 CLI `--once --dry-run` must behave identically and remain default/read-only.

- `--notify-once` or equivalent **explicit, operator-invoked, disabled-by-default** mode that performs one read/validation/send attempt, only after explicit runtime opt-in flag and local configuration.
- The actual Codex sender is an injectable interface whose tests use a spy/mock; no code/test should inadvertently invoke real `codex queue`.
- Live sender command shape: official locally verified Codex binary `codex queue --thread <EXACT_LOCAL_UUID> --message <SAFE_FIXED_TEMPLATE>`, passed as argument array, `shell=False`; no `--resume` in B2A; no `--last`, no creating a new session, no arbitrary flags.
- Distinguish notification from implementation: `mode=probe|notify` only. A GitHub Issue containing `mode=implement` always produces `BLOCKED/REJECTED` **even if 007 QA becomes accepted**. No coding task can be started by B2A.
- The output notification must explicitly prohibit edits/Git writes/starting 007 or 008, and request an ACK only. Never concatenate external Issue free text, runnable scripts, or URLs into the prompt.
- The target **existing** Codex session UUID, expected user and Codex binary path are pinned only in user-scoped local configuration; never committed, placed in Issue body, sent to GitHub, or printed in logs.

## 2. GitHub v2 dispatch and authorization manifest

- Define a strict v2 `dispatch` fenced JSON schema for notification/probe, including exact `schema_version=2`, `dispatch_id`, `mode`, `module`, `repo`, `notification_record_path`, `notification_record_sha`, `handoff_path`, `handoff_blob_sha`, `created_by`, `expires_at`, `requires_human_approval`, no unknown keys.
- Validate fixed private repo, allowlisted author, open issue, exact `dispatch:approved` label, safe paths, expiry and SHA. Labels/author are **necessary, never sufficient**.
- Read only `main` from GitHub; recompute Git blob identity for both the notification record and canonical handoff, and verify exact record–issue–handoff agreement. Strictly parse an explicit, current Design Window **notification-only** authorization record (not a generic string `APPROVED` or prose text).
- The record must pin exact single job/dispatch_id, module, notification mode, handoff SHA, notification template version, expiry and a nonce. The record is data, not executable code. Store the canonical record only as fixture during B2A development; **do not** create any live `dispatch:approved` notification Issues or active cloud manifests as part of this implementation.
- Current Module 008 `DESIGN APPROVED` permits a notification that its design exists, **but never implements 008** or alters its blocked status. B2A v2 may classify a notification as authorized after manifest check without requiring Module 008's implementation gate to be open; still put a verified *blocked* note in the safe message.
- Any contradictory/duplicated field, edited `main` blob, stale manifest, invalid nonce, wrong account, missing current authorization or expiry => no queue attempt.
- Keep the frozen B1 `schema_version=1` path, authorization parser, `47` tests and `--once --dry-run` behavior unchanged.

## 3. Windows transport, state and retries

- Use official installed CLI. For both `gh` and `codex` process capture, use bytes + strict UTF-8 / sanitized error handling on Windows `cp936`. No global codepage changes, `chcp` or implicit console output decoding. Do not expose raw secrets/credentials/thread UUIDs.
- Single foreground call, one-instance lock. No scheduled task, background daemon, autostart, watcher, network port or privileged service. Provide obvious `dispatch_enabled=false` / disable kill switch; no sender call until all checks and explicit operator opt-in pass.
- Commit a **durable local PREPARED intention before invoking queue**, with atomic write+flush, disk safety and a per-process/restart one-attempt key (`repo,issue#,dispatch_id,auth_blob_sha`). Separate it from B1's dry-run duplicate receipt table.
- On validated CLI return 0: `QUEUE_SUBMITTED`, **not** `DELIVERED` or `ACK_VERIFIED`.
- On timeout/crash/uncertain result after preparing, mark `UNKNOWN_DELIVERY`; **never automatically re-send**. After restart, all PREPARED/QUEUE_SUBMITTED/UNKNOWN_DELIVERY/ACK_REPORTED/ACK_VERIFIED states suppress further automatic submissions. If state write/lock/ACL fails, stop **before** invoking Codex.
- On cancelled or expired notification before PREPARED: no send. Cancellation after submitted queue item is best-effort, not proven revocation.
- Session unavailable/unloaded/locked: record accurate BLOCKED/UNKNOWN status; do not force resume or create substitute session.
- Minimize local retention; thread ID local-only. Do not assume the B1 fixed receipt store implies delivery.

## 4. ACK and reporting — B2A manual verification, no GitHub write API

- Fixed nonce format: `PWS-B2-ACK <dispatch_id> <nonce>`. A secure B2A probe requires observing this exact ACK **in the pinned original Codex Desktop thread**; queue success cannot satisfy it.
- B2A code may record `QUEUE_SUBMITTED` or `ACK_REPORTED` based on operator observation, but **must not auto-promote ACK_VERIFIED** without a proven thread evidence source.
- The operator / independent QA may **manually** add a redacted GitHub Issue comment for a later authorized live-host probe. The poller/dispatcher itself **must not have GitHub write methods** in B2A.
- No code may use undocumented Codex rollout SQLite/JSON databases for injection or ACK verification.
- Actual one-time live sending to the original thread is prohibited during development, QA, or before a distinct Design Window smoke authorization.

## 5. Safety and quality gates

- Keep all B1 47 tests passing with no semantic change to default GET-only dry-run.
- New tests must cover the **24-point QA matrix in `docs/dispatch/B2_DESIGN_APPROVED.md`** individually, using mocks and fixtures where live execution is not authorized.
- Focused cases: wrong and expired issue, forged label/author, SHA mismatch, hostile Issue text, wrong/closed session, implement-mode rejection, 008 notification while implementation blocked, local UUID privacy, launcher injection/`shell=False`, success != ACK, one-shot dedupe, crash between durable PREPARED and CLI exit, multiple processes, corrupt or unwritable state, interrupted network, cp936, high-volume bounded input, disable switch, cancellation and replay.
- Accurate PASS/PARTIAL/FAIL/NOT VERIFIED; acceptance #24 (real same-thread ACK) MUST be **NOT VERIFIED** at code QA stage, not fabricated PASS. Independent QA can accept code with real smoke gated if no safety blocker.
- Run Python compile/tests, existing Workspace tests `104/104` baseline, typecheck, lint, build and diff checks; report actual command output, not expected results. New tests may increase total counts.

## 6. Delivery, PR and independent QA

1. Code only in isolated `codex/dispatch-b2a` branch from up-to-date clean main. Do not edit Study Modules 007/008, global application `src/`, frozen B2 design or B1 status unless a separately approved integration necessity is discovered.
2. Provide code, docs, local setup/disable/uninstall instructions, mocked fixtures and tests. No installed Windows service/Task Scheduler or real Codex queue calls.
3. Add `tools/dispatch-inbox/B2A_QA_HANDOFF.md` recording accepted base, implementation SHA, exact paths, side effects, 24 acceptance rows and negative tests, known risks, actual test outputs, security model and Windows real-host live-smoke **NOT RUN**.
4. Open B2A PR; do **not** merge. Independent QA Window is **Review Only**; it must inspect real diff, all B1 regression, security/consent boundaries and simulated failures.
5. Return PR URL, exact head, independent QA comment and any blocker to Design Window. Only Design Window can accept B2A code, authorize merge, and issue a separate one-time live-host notification probe.
6. B2B unattended watcher and B3 implementation routing are **strictly forbidden** in this PR. No Module 007/008 coding, no `codex queue` actual sending, no new GitHub dispatch labels or approved live Issues.

**End state for this instruction:** B2A code ready for independent QA and, if accepted, merge *without actual notification delivery*. The goal is to eliminate future manual prompt forwarding only after later real-host ACK and separately approved unattended B2B setup.
