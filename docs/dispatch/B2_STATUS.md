# Dispatch B2 Status — V1.0

- **Product:** Personal Workspace — GitHub → Existing Windows Codex Session Notifications
- **Phase:** B2 — B2A first (supervised notification-only capability)
- **Design:** APPROVED / DESIGN FROZEN (explicit user confirmation 2026-11-21)
- **Frozen Design:** `docs/dispatch/B2_DESIGN_APPROVED.md`
- **Authoritative B2A Execution Instruction:** `docs/dispatch/B2A_EXECUTION_INSTRUCTION.md`
- **B2A Development Authorization:** APPROVED FOR **CODE + MOCK TESTS + INDEPENDENT QA ONLY**
- **B2A Implementation:** **CODE ACCEPTED / MERGED INTO `main`** — PR #9 Revision 01 accepted candidate `cba80fa7eabb55abf0c928e68ddad622e38a6516`, merge commit `ca68d1c1f952b3766647e2810e72483dfd5cef2c`; default-disabled notification sender, not running automatically
- **B2A Independent QA:** **ACCEPTED FOR CODE** — Revision 01 23 PASS / 0 FAIL / 1 NOT VERIFIED; original candidate REJECTED, B2A-QA-001 High CLOSED. QA: https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7064087898
- **B2A Real Windows Host Queue Probe:** **ONE-TIME HARMLESS PROBE AUTHORIZED / NOT YET RUN** on 2026-11-21 after user requested continuation. Scoped to Issue #10, pinned `main` manifest and the exact originally verified Desktop thread; QA item #24 remains NOT VERIFIED until the observed same-thread nonce ACK.
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
- **Next Action:** Existing Windows Codex execution operator reads `docs/dispatch/B2A_WINDOWS_LIVE_PROBE_V1.md` and Issue #10, performs all preflight/identity/SHA/current-thread checks and **at most one** `b2_notify.py --notify-once --enable-notifications` run, restores `dispatch_enabled=false`, reports sanitized outcome on Issue #10 and STOPS. If preflight fails or expiry passes, NO SEND. B2B/B3 and Modules 007/008 remain blocked.

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

## B2A Exactly-One-Notification Windows Probe Authorization — 2026-11-21

- **Authorization:** User requested continuation from merged B2A code QA to the next validation gate. Design Window authorizes **only one harmless existing-session notification probe**; no implementation.
- **One-time operator instruction:** `docs/dispatch/B2A_WINDOWS_LIVE_PROBE_V1.md` on main.
- **Live test Issue:** https://github.com/zyyu1/personal-workspace/issues/10 — open, trusted author, `dispatch:approved`, strict schema v2, `mode=probe`, module `dispatch-b2a`.
- **Dispatch ID:** `PWS-B2A-SMOKE-20261121-ISSUE10`.
- **Manifest:** `docs/dispatch/notifications/PWS-B2A-SMOKE-20261121-ISSUE10.md`, exact pinned blob `ce4d9a0ca6d56c540c9f0d3204684f26d1bbb989`.
- **Approved handoff:** `docs/dispatch/B2_DESIGN_APPROVED.md`, blob `7573e5c9cdc2b3a9fd14a46568f8f4ad49019a67`. No execution instruction or module handoff is approved for a Codex coding turn.
- **Expiry:** 2026-11-23 18:00 CET. Expired / changed / missing approval => no send.
- **GitHub preparatory check:** Issue exact fields, trusted identity, approval label, manifest SHA and handoff SHA match independently verified. **Queue not sent at publication.**
- **Expected ACK:** `PWS-B2-ACK PWS-B2A-SMOKE-20261121-ISSUE10 PWSB2A-NONCE-20261121-ISSUE10`, only accepted after the operator verifies the original Codex Desktop thread actually responded.
- **Execution:** Disabled by default and operator supervised; exactly one explicit `--notify-once --enable-notifications` run; local thread UUID remains private. After a try, disable local flag, keep dedupe outbox and stop. No retries on uncertain delivery.
- **Closure:** Design Window independently reviews Issue #10 operator report, removes `dispatch:approved`, closes/cancels the one-time test Issue, then marks operational PASS/FAIL/INCONCLUSIVE. Do not claim PASS merely because an Issue was published or queue returned exit 0.
- **B2B/B3:** NOT AUTHORIZED / NOT RUNNING. No Task Scheduler, background polling, auto-ACK, GitHub poller write permissions, auto-implementation, or work on Modules 007/008.

The preceding historical B2A code-only limitation was true at merge time. This new section is the later **limited live probe authorization**, not general permission to send other messages.
