# Dispatch B2 Status — V1.0

- **Product:** Personal Workspace — GitHub → Existing Windows Codex Session Notifications
- **Phase:** B2 — B2A first (supervised notification-only capability)
- **Design:** APPROVED / DESIGN FROZEN (explicit user confirmation 2026-11-21)
- **Frozen Design:** `docs/dispatch/B2_DESIGN_APPROVED.md`
- **Authoritative B2A Execution Instruction:** `docs/dispatch/B2A_EXECUTION_INSTRUCTION.md`
- **B2A Development Authorization:** APPROVED FOR **CODE + MOCK TESTS + INDEPENDENT QA ONLY**
- **B2A Implementation:** **CODE ACCEPTED / MERGED INTO `main`** — PR #9 Revision 01 accepted candidate `cba80fa7eabb55abf0c928e68ddad622e38a6516`, merge commit `ca68d1c1f952b3766647e2810e72483dfd5cef2c`; default-disabled notification sender, not running automatically
- **B2A Independent QA:** **ACCEPTED FOR CODE** — Revision 01 23 PASS / 0 FAIL / 1 NOT VERIFIED; original candidate REJECTED, B2A-QA-001 High CLOSED. QA: https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7064087898
- **B2A Real Windows Host Queue Probe:** **NOT AUTHORIZED / NOT RUN**; code QA acceptance is complete, but a future live notification requires an independent, specific user/Design Window one-time probe instruction; QA item #24 stays NOT VERIFIED
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
- **Next Action:** B2A code is merged; **await separate explicit one-time Windows live notification probe authorization** to test same-original-thread message delivery and nonce ACK. Do not enable notifications, create active dispatch Issues, run `codex queue`, or install background automation until this gate is approved.

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

## B2A Revision 01 — Final Code Acceptance (2026-11-21)

- **Initial rejected candidate:** `0d37e2ff038b23ce390f4bcff8ee3e3182076ce4`, [QA REJECTED](https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7063918022)
- **Revision 01 remediation:** `7ed48ce7cb33608c8f57cbbb0f73ed01cf0983a2`; strict Issue/Record/outer-identity/local-config JSON type checks close B2A-QA-001
- **Accepted reviewed HEAD:** `cba80fa7eabb55abf0c928e68ddad622e38a6516`
- **Merge commit:** `ca68d1c1f952b3766647e2810e72483dfd5cef2c`
- **PR:** https://github.com/zyyu1/personal-workspace/pull/9
- **Independent QA:** https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7064087898 — **ACCEPTED**, 23 PASS / 0 FAIL / 1 NOT VERIFIED (live queue/ACK)
- **Design Window final code acceptance:** https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7064119512
- **Security test:** Five original attacks closed; 206 malicious Issue/Record/Identity variants + 55 malicious local-config variants rejected with zero sender calls/outbox writes; canonical notification still valid; `mode=implement` remains forbidden
- **Regression:** Python 85/85 PASS (B1 47 + B2A 38); Workspace 104/104 PASS; compile/typecheck/build/diff check PASS; lint 0 errors / 12 historical warnings
- **Operation status:** NOT RUNNING / disabled by default. No actual `codex queue`, no same-original-thread ACK, no GitHub writes from dispatcher, no B2B scheduler/service and no business module coding
- **Next gate:** separately approve a safe, exact-one-event B2A live-host notification probe, then independently verify the original Codex Desktop thread's ACK. A merge alone does not activate B2A delivery.
- **B2B:** BLOCKED / NOT AUTHORIZED
- **B3:** BLOCKED / NOT AUTHORIZED
- **Module 007:** NOT STARTED / QA PENDING in last checked main handoff
- **Module 008:** NOT STARTED / BLOCKED BY MODULE 007 accepted independent QA

The earlier rejected candidate and remediation authorization are historical evidence retained above and in PR #9. The current source of truth is the accepted **Revision 01 code** plus **live probe NOT VERIFIED**. No B2A live dispatch approval is implied by this status update.
