# Dispatch B2 Status — V1.0

- **Product:** Personal Workspace — GitHub → Existing Windows Codex Session Notifications
- **Phase:** B2 — B2A first (supervised notification-only capability)
- **Design:** APPROVED / DESIGN FROZEN (explicit user confirmation 2026-11-21)
- **Frozen Design:** `docs/dispatch/B2_DESIGN_APPROVED.md`
- **Authoritative B2A Execution Instruction:** `docs/dispatch/B2A_EXECUTION_INSTRUCTION.md`
- **B2A Development Authorization:** APPROVED FOR **CODE + MOCK TESTS + INDEPENDENT QA ONLY**
- **B2A Implementation:** INITIAL CANDIDATE SUBMITTED — **INDEPENDENT QA REJECTED** (PR #9, HEAD `0d37e2ff038b23ce390f4bcff8ee3e3182076ce4`); Revision 01 SECURITY REMEDIATION AUTHORIZED, not yet verified
- **B2A Independent QA:** **REJECTED** at original candidate HEAD (22 PASS / 1 FAIL / 1 NOT VERIFIED); High B2A-QA-001 JSON type-confusion fail-open; independent re-review pending after Revision 01
- **B2A Real Windows Host Queue Probe:** NOT AUTHORIZED / NOT RUN; must first receive independent code QA acceptance, then separately explicit one-time probe approval
- **B2B Unattended Windows Polling:** NOT AUTHORIZED / NOT INSTALLED
- **B3 Automatic Implementation Routing:** NOT AUTHORIZED
- **B0 Existing-Session Probe:** ACCEPTED — `codex queue` reached same original Windows Desktop thread, Issue #3
- **B1 Inbox:** OPERATIONAL GATE ACCEPTED (2026-11-21) — B1 and UTF-8 Revision 02 merged, real Windows `cp936` read-only smoke PASS, Issue #4
- **GitHub Inbox:** Private `zyyu1/personal-workspace` Issues, future strict v2 notification authorization with pinned main-branch handoff and notification record
- **Send Policy:** Notification/probe only; B2 refuses `mode=implement` even if a module is approved
- **ACK Policy:** `QUEUE_SUBMITTED` never implies same-thread delivery or ACK. Verified original-session nonce ACK required for later operational acceptance
- **Safety Defaults:** `dispatch_enabled=false`, exact locally pinned UUID, no secrets on GitHub, no automatic retry after uncertain delivery, no service/scheduler/daemon, no poller GitHub write API in B2A
- **Module 007:** Handoff design approved; last verified `docs/handoffs/007/STATUS.md` says NOT STARTED / QA PENDING
- **Module 008:** Design approved; remains NOT STARTED and BLOCKED by Module 007 independent QA accepted implementation
- **Design Draft PR #7:** Historical proposal preserved; approved design on `main` is authoritative
- **Next Action:** Development Window reads `docs/dispatch/B2A_REMEDIATION_REV01.md`, repairs exact Issue/Record JSON field types in **same** `codex/dispatch-b2a` branch / PR #9, adds adversarial tests and requests independent Review Only re-review. No merge or real target-session delivery before separate Design Window acceptance.

**Approval boundary:** User's B2 design confirmation permits design freeze and the publication of a separate, scoped B2A code implementation instruction. It does not enable or install unattended automatic dispatch and does not authorize a real `codex queue` probe. B2B/B3 and module implementation remain separate future gates.

## B2A Revision 01 — High Finding & Gate (2026-11-21)

- **PR:** https://github.com/zyyu1/personal-workspace/pull/9 (OPEN / UNMERGED at original rejection)
- **Rejected HEAD:** `0d37e2ff038b23ce390f4bcff8ee3e3182076ce4`
- **Original independent QA:** https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7063918022
- **QA matrix:** 22 PASS / 1 FAIL / 1 NOT VERIFIED; B1+B2A Python 76/76 PASS, Workspace 104/104 PASS, but High fail-open remains blocking
- **B2A-QA-001 / High:** strict v2 notification authorization wrongly accepted numeric/boolean JSON type substitutions (`2.0==2`, `1==True`, `true==1`) in Issue/Record validation
- **Formal remediation instruction:** `docs/dispatch/B2A_REMEDIATION_REV01.md`, authorized by Design Window; exact type table for Issue/Record, adversarial regression, no live queue, independent QA re-review
- **Operational gate:** B2A REAL QUEUE NOT RUN / NOT AUTHORIZED; B2B not enabled; B3 not authorized; Module 007 not started, Module 008 blocked by Module 007 QA

Do not merge or run real `codex queue` from any PR #9 Revision 01 candidate until new independent QA and new explicit Design Window decision. The original QA REJECTED evidence remains immutable in the PR discussion.
