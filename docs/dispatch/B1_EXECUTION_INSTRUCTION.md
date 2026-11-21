# Personal Workspace — B1 Read-Only GitHub Inbox Listener / Execution Instruction

**Status:** IMPLEMENTATION APPROVED FOR B1 ONLY — 2026-11-21
**Owner:** Windows Codex Development Window
**Approval:** Design Window, after B0 Existing-Session Queue Probe ACCEPTED
**Repository:** `zyyu1/personal-workspace` (PRIVATE)
**Design reference:** `docs/dispatch/DESIGN_V1.0_DRAFT.md` at design branch `design/windows-codex-dispatch-v1`, original Git blob `30b865c138fa097ccce8450fb9fda1288b8cf8eb`. The draft contains future B2/B3 concepts; **ONLY the B1 subset below is authorized**.
**B0 evidence:** https://github.com/zyyu1/personal-workspace/issues/3 — original Windows Codex session received an explicit-UUID queue probe and replied with exact ACK, no project mutation.
**Implementation dependency:** B1 is independent of Module 007/008 implementation and may be developed separately. **Do not start either Module 007 or Module 008 under this instruction.** Module 008 remains blocked by Module 007 independent QA.

## 0. Required acceptance boundary

Build **only a read-only / dry-run GitHub Issues inbox poller** for the existing Windows Codex setup. The goal is to verify safe discovery, filtering, authorization validation, deduplication and diagnostics of future task envelopes **without sending anything to Codex**.

B1 must not:
- Call `codex queue`, `codex exec`, `codex app-server`, or interact with a live Codex session in any way.
- Install or run a Windows background service, scheduled task, auto-start process, remote HTTP server or inbound listener.
- Post/change GitHub Issues, comments, labels, PRs or repository status **from the listener**. A separate developer PR for this work is allowed.
- Trigger Module 007/008 coding, copy external untrusted Issue text into a shell command, or download arbitrary code from Issues.
- Read/store token values or reveal any session UUID, API key, PAT or personal secret in logs.
- Change `src/`, domain repositories, data models or UX as part of B1.

**B1 == operator-invoked program with dry-run read-only GitHub API calls and local test data.** Watching a local terminal is optional; unattended scheduling is not.

## 1. Preparation & three-project reuse check

Before coding, inspect actual Git/Windows state, branch, status and available tooling. Follow the user's GitHub-first rule: examine the three reference repositories from the draft, verify current Stars, latest commit, license, stack, Windows support and installation difficulty, then document what is reused vs adapted:
- https://github.com/openai/codex — Apache-2.0, official CLI. B1 must *not* invoke queue, use only as interface reference.
- https://github.com/cli/cli — MIT, Go prebuilt `gh` client. Preferred external API interface **only if installed**.
- https://github.com/songyb111-gachon/codex-auto-resume-windows — MIT, Windows/Python, version-sensitive. Reference concepts only; do **not** install.

Prefer stdlib Python or built-in PowerShell on the existing Windows installation. Minimize dependencies and explain installation/licensing risk. If `gh` is absent, implement dependency-checked graceful `UNAVAILABLE` (do not auto-install). For real GitHub API access use the current authenticated user in a **read-only** manner, never embed tokens.

Do not change the frozen 007/008 handoffs. Branch `codex/dispatch-b1` from fresh `origin/main`; avoid overwriting any local modifications, hard reset or force push.

## 2. Implemented components — within isolated tooling directory

Place only B1 tooling and tests under `tools/dispatch-inbox/` or `scripts/dispatch-inbox/` (choose one based on repo conventions).

Required:
1. A clear README with Windows prerequisites, `--once --dry-run` usage, fixtures, troubleshooting, security, why no automatic dispatch is enabled, uninstall steps.
2. A fixed allowlisted repository `zyyu1/personal-workspace`, trusted GitHub account `zyyu1` and code path in local configuration. Do **not** make repo/owner selection freely user-supplied.
3. A GitHub Issues read adapter using `gh api` with explicit user-facing authentication error handling, response limits, timeout, backoff and pagination with bounded max pages. No write API or unbounded full-repository scraping.
4. A strict dispatch envelope schema with `schema_version=1`, `dispatch_id`, `mode`, `module`, `repo`, `handoff_path`, `handoff_blob_sha`, `created_by`, `expires_at`, `requires_human_approval` and `gate_status`. Reject unknown fields/modes, unsafe paths, non-main or mismatching SHA, incorrect sender, expired jobs, duplicate IDs, malformed JSON/markdown envelope. Avoid shell interpolation entirely.
5. Four classification results: `ELIGIBLE_DRY_RUN`, `BLOCKED_GATE`, `REJECTED_UNTRUSTED`, `UNAVAILABLE` (with distinct codes/details). Even eligible jobs **must never call Codex** during B1.
6. Local read-only output suitable for later audit: issue number, dispatch_id, classification, reason code, repository and authoritative blob SHA. Do not print sensitive auth/session data, entire prompts or personal filesystem paths. If persisting local receipts for dedupe, use a user-owned file under local app data, atomic writes, bounded log size and explicit opt-out.
7. `--once --dry-run` default, optionally `--watch --dry-run` only as a foreground operator process with >=60 sec interval, one-instance lock and Ctrl+C shutdown. Do not add it to Windows startup or Task Scheduler.

If the repo lacks the envisaged Issue labels, treat current inbox as **NO ELIGIBLE TASKS** / `UNAVAILABLE CONFIG`, not as authorization to consume arbitrary Issues. Do not create approval labels, task Issues, or mutate GitHub programmatically as part of B1. Static fixtures may simulate approved/blocked labels without cloud-side modifications.

## 3. Robustness, anti-abuse and dependency gates

- Reject unexpected `repository_full_name`, Issue author, state, missing/wrong `dispatch:approved` labeling, unrecognized mode, unexpected non-main handoff path or invalid SHA.
- Note that Github labels and Issue authorship **alone are not sufficient** for code execution authorization. In B1 classification, validate an explicit signed-off authorization record in the authoritative handoff/STATUS and require `requires_human_approval=true` for future implementation requests. Real execution is B3, not B1.
- Check Module 008's current `docs/handoffs/008/STATUS.md`: until 007 QA ACCEPTED with accepted implementation SHA, classify implementation intent as `BLOCKED_GATE` even if a forged Issue says READY.
- Treat HEAD SHA or file SHA changes during polling as an invalid/outdated envelope; no speculative acceptance.
- Missing/expired GitHub auth, HTTP 403/404, rate limits, partial pages, malformed response, offline state and token limitation must be nonfatal and show meaningful errors.
- Stable dispatch ID plus GitHub Issue ID is the dedupe key; avoid duplicate dry-run notifications on repeated polling. Do not silently mark any external request `delivered` or `acked`.

## 4. B1 tests and acceptance matrix (report individually)

1. `--once --dry-run` reads authenticated private repository Issues without API mutations.
2. Non-admin or wrong-account issue rejected.
3. Missing/untrusted approval label rejected.
4. Unknown mode/schema or extra fields rejected.
5. Unsafe directory traversal / external handoff URL rejected.
6. Missing/mismatched frozen instruction blob SHA rejected.
7. Expired requests rejected.
8. Module 008 implementation request classified `BLOCKED_GATE` while 007 QA pending.
9. Valid fixture classified `ELIGIBLE_DRY_RUN` but never queued.
10. Duplicate dispatch_id or same Issue on repeated run does not emit duplicate accepted delivery.
11. Network/GitHub rate-limit/auth errors produce bounded `UNAVAILABLE` with useful reason and no secrets.
12. Bounded paging and timeouts prevent infinite polling/hangs.
13. No user filesystem/network listening privileges beyond outgoing GitHub reads.
14. No subprocess call to any `codex` executable; positive test/spy verifies this.
15. No issue/PR/comment/label writes by poller (separate development PR does not count).
16. No Windows Task Scheduler/service/startup modifications.
17. No `src/` or Module 007/008 implementation changes.
18. Tests run with real command/exits, and unchanged project typecheck/build/test/regression where appropriate.
19. Windows manual smoke: selected private repo readable, `gh auth status` works with redacted evidence, reports `NO ELIGIBLE TASKS` if appropriate.
20. B1 docs contain safe disable/uninstall and explain B2/B3 independently approved gates.

Each acceptance row must have `PASS / PARTIAL / FAIL / NOT VERIFIED` and actual evidence. Report tool versions, test execution, failing cases, and limitations accurately.

## 5. Development deliverable

- Open an isolated development PR from `codex/dispatch-b1`, **do not merge to main**.
- Include `B1_QA_HANDOFF.md` in the branch: exact commit SHA, changed paths, 20 acceptance rows, tests and command outputs, security review, Windows observed behavior, remaining gaps.
- Request independent QA Window **Review Only**. QA must explicitly check no queue/agent call, no GitHub write or unintended credential exposure, immutable source baseline, and gate blocking.
- Return PR link and QA evidence to Design Window for ACCEPTED / REMEDIATION / REJECTED.
- **Do not start B2 notification delivery or B3 implementation routing** without separate Design Window approval. If local Windows capabilities are missing, report blockers and stop rather than install/unlock features silently.

**This is a real B1 development instruction, not permission for 007/008 coding or autonomous Codex-session injection.**
