# Dispatch B1 Status

- **Name:** Windows GitHub Issues Inbox — Read-Only / Dry-Run Listener
- **Phase:** B1
- **Design Window Authorization:** APPROVED (2026-11-21)
- **Implementation:** CANDIDATE SUBMITTED — REJECTED BY INDEPENDENT QA; REMEDIATION REVISION 01 AUTHORIZED
- **Independent QA:** REJECTED on PR #5 candidate HEAD `95ad61fa9fab308cb7a87c7d30929f448779874d` (17 PASS / 2 FAIL / 1 PARTIAL; three High blockers)
- **B0 Probe:** ACCEPTED; report archived in https://github.com/zyyu1/personal-workspace/issues/3
- **Authoritative B1 Instruction:** `docs/dispatch/B1_EXECUTION_INSTRUCTION.md`
- **Planning Reference:** Draft PR #2, `docs/dispatch/DESIGN_V1.0_DRAFT.md` (B2/B3 conceptual design NOT authorized)
- **B1 Scope:** Authenticated private GitHub Issues read, strict envelope parsing, prerequisites/security checks, fixtures, local dry-run classification, Windows smoke and independent QA
- **No B1 auto-send:** NO `codex queue`, NO `codex exec`, NO app-server messages, NO Windows service/scheduler, NO GitHub API writes from listener, NO automated implementation
- **B2:** BLOCKED — requires B1 independent QA ACCEPTED and new explicit Design Window authorization
- **B3:** BLOCKED — requires additional authorization, genuine module gating and delivery ACK checks
- **Module 007:** No implementation acceptance recorded in handoff status at B1 authorization
- **Module 008:** NOT STARTED / BLOCKED BY MODULE 007 independent QA
- **Remediation Instruction:** `docs/dispatch/B1_REMEDIATION_REV01.md` (approved by Design Window, 2026-11-21)
- **Blocking Findings:** B1-QA-001 authorization false-positive; B1-QA-002 008 gate missing accepted 007 implementation SHA; B1-QA-003 wrapped GitHub Contents Base64 decode failure.
- **Environment Gap:** QA #19 remains PARTIAL (`GH_NOT_INSTALLED` on Windows; no silent install).
- **Next Action:** Development Window repairs **only** B1 on existing `codex/dispatch-b1` PR #5, produces new candidate HEAD and QA handoff, then independent QA re-reviews. No merge until Design Window accepts. This GitHub publication does **not** automatically contact the currently open Windows Codex Desktop thread.

The shared GitHub inbox/PR may be read by connected tools; it does not wake an inactive local Windows Codex conversation until a receiver is installed and separately approved. Do not claim B1 automatic dispatch is running merely because the instruction is on GitHub.
