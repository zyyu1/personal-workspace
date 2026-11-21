# Dispatch B2 Status — V1.0

- **Product:** Personal Workspace — GitHub → Existing Windows Codex Session Notifications
- **Phase:** B2 — B2A first (supervised notification-only capability)
- **Design:** APPROVED / DESIGN FROZEN (explicit user confirmation 2026-11-21)
- **Frozen Design:** `docs/dispatch/B2_DESIGN_APPROVED.md`
- **Authoritative B2A Execution Instruction:** `docs/dispatch/B2A_EXECUTION_INSTRUCTION.md`
- **B2A Development Authorization:** APPROVED FOR **CODE + MOCK TESTS + INDEPENDENT QA ONLY**
- **B2A Implementation:** **CODE ACCEPTED / MERGED INTO `main`** — PR #9 Revision 01 accepted candidate `cba80fa7eabb55abf0c928e68ddad622e38a6516`, merge commit `ca68d1c1f952b3766647e2810e72483dfd5cef2c`; default-disabled notification sender, not running automatically
- **B2A Independent QA:** **ACCEPTED FOR CODE** — Revision 01 23 PASS / 0 FAIL / 1 NOT VERIFIED; original candidate REJECTED, B2A-QA-001 High CLOSED. QA: https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7064087898
- **B2A Real Windows Host Queue Probe:** **PASS / MANUAL SAME-THREAD ACK ACCEPTED (2026-11-21)** — one authorized queue submission (`QUEUE_SUBMITTED`, exit 0) was followed by the user's exact matching nonce ACK pasted into the Design Window chat and explicit confirmation that they observed/copied it from the original Windows Codex Desktop execution thread. This is **human-attested** evidence, not machine-verified Codex telemetry. Acceptance: https://github.com/zyyu1/personal-workspace/issues/10#issuecomment-7064353100. QA #24 ACCEPTED for the scoped one-shot probe. Approval label revoked; no resend or further dispatch authorized.
- **B2B V1.1 On-Demand Bridge:** **PAUSED BY USER (2026-11-21)** — design APPROVED, but first code candidate on PR #13 (`650ef85dce0549602ba20bd2d8f10835ee219e70`) was independently QA REJECTED (High `B2B-QA-001` incomplete GitHub authorization snapshot fail-open). Revision 01 remediation was AUTHORIZED but **NOT IMPLEMENTED/NOT REVERIFIED** as last verified. Issue #12 and PR #13 remain OPEN, UNMERGED and ON HOLD; no further B2B work until the user explicitly resumes. No launcher installation, real queue, watcher, B3 or module coding.
- **B2B V1.0 Unattended Windows Polling:** REJECTED AS USER REQUIREMENT / NEVER AUTHORIZED / NOT INSTALLED
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
- **Next Action:** B2A supervised one-shot operational smoke is **COMPLETE**. The sender stays disabled (`dispatch_enabled=false`); preserve the single-delivery outbox and the consumed Issue #10 record. No more Queue probes or implementation tasks are authorized. **B2B unattended listener requires separate design, security/QA and user approval**; B3 and Modules 007/008 are not activated by this acceptance.

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

## B2A One-Shot Host Run — QUEUE_SUBMITTED / ACK PENDING (2026-11-21)

- **Operator report:** https://github.com/zyyu1/personal-workspace/issues/10#issuecomment-7064280840
- **Design Window reconciliation:** https://github.com/zyyu1/personal-workspace/issues/10#issuecomment-7064300388
- **B2A invocation:** exactly one accepted `py -3.13 tools/dispatch-inbox/b2_notify.py --notify-once --enable-notifications`, exit 0
- **Queue status:** `QUEUE_SUBMITTED / QUEUE_EXIT_ZERO_NOT_ACK` — this is not proof of Desktop delivery, prompt processing or ACK
- **Observed same-thread ACK:** **NO / PENDING** while original thread's operator turn was still active at report time
- **Local state:** `dispatch_enabled=false` restored; one `QUEUE_SUBMITTED` outbox record preserved; lock released; project Git worktree CLEAN; no implementation side effects
- **GitHub safety:** the one-shot `dispatch:approved` label on Issue #10 was **removed after the submitted attempt**; Issue #10 remains OPEN solely for operator evidence and final disposition. Do not re-add the label or recreate the authorized dispatch.
- **Next permitted activity:** inspect original supported Desktop thread **after turn completion**, optionally post redacted exact ACK evidence to Issue #10; **no repeat queue submission**
- **B2A operational acceptance:** INCONCLUSIVE / ACK PENDING, QA #24 NOT VERIFIED
- **B2B / B3:** NOT AUTHORIZED, NOT RUNNING; Module 008 remains BLOCKED by Module 007 independent QA

The earlier one-time probe authorization was consumed; the status above supersedes the historical 'NOT YET RUN' and the earlier authorized-but-unused notice. A later same-thread ACK may justify a formal acceptance update after independent review, but cannot reactivate delivery permission.

## B2A Original-Thread ACK — Final Manual Verification and Acceptance (2026-11-21)

- **One-time test Issue:** https://github.com/zyyu1/personal-workspace/issues/10 (approval label removed after queue submission; one-shot consumed)
- **Earlier operator report:** https://github.com/zyyu1/personal-workspace/issues/10#issuecomment-7064280840 — B2A exit 0, `QUEUE_SUBMITTED / QUEUE_EXIT_ZERO_NOT_ACK`, locally pinned original active thread, no retry, disabled local config, clean worktree
- **Earlier Design Window pending decision:** https://github.com/zyyu1/personal-workspace/issues/10#issuecomment-7064300388 — ACK PENDING while the original Codex operator turn was active
- **New ACK evidence (manual attestation):** User posted `PWS-B2-ACK PWS-B2A-SMOKE-20261121-ISSUE10 PWSB2A-NONCE-20261121-ISSUE10` in the Design Window chat and explicitly confirmed **they saw and copied it from the original Windows Codex Desktop execution thread**. This is not independent remote session access, auto-ACK telemetry, or authenticated Codex event-stream verification; it is an exact-string human observation under the approved B2A manual verification procedure.
- **Formal B2A operational decision:** **PASS — scoped one-time same-original-thread delivery and matching nonce ACK observed by the user**, [Design Window acceptance](https://github.com/zyyu1/personal-workspace/issues/10#issuecomment-7064353100).
- **QA matrix #24:** PASS by **manual human-attested original-thread ACK**; not a claim that automatic ACK exists. The Revision 01 code QA's original `NOT VERIFIED` result remains historical, and its 23/0/1 code-only matrix is unchanged.
- **GitHub status:** Issue #10 one-time approval permanently consumed; do not re-add `dispatch:approved`, regenerate/reuse record, or reset outbox to resend. Issue #8 was code-complete at the B2A merge and is now eligible for closure after this operational gate.
- **Security:** `dispatch_enabled=false` restored and retained, no background watcher/service/scheduler, no poller GitHub write API, no B2B or B3, no module 007/008 application code.
- **Next design gate:** **B2B automatic polling**, only with a new user decision, formal scoped design, independent QA, durable deduplication, disable/uninstall control and separately approved real-host tests.

B2A PASS applies only to the one authorized supervised notification. It **does not prove** continuous unattended delivery, automatic ACK verification or permission to start arbitrary development tasks.

## B2B V1.1 — User-Approved On-Demand Architecture (2026-11-21)

- **User instruction:** “我不希望后台一直挂着，我希望只有在提出需求的时候才执行”; user subsequently confirmed **“可以”** to the *one-click on-demand receiver* alternative.
- **Design freeze:** `docs/dispatch/B2B_ON_DEMAND_DESIGN_APPROVED.md` on `main` — no periodic polling, no watcher, no Windows Task Scheduler, no service, no logon autorun.
- **Code development authority:** `docs/dispatch/B2B_ON_DEMAND_EXECUTION_INSTRUCTION.md`; **code/mocked tests/independent Review Only QA only**. GitHub Issue #12: https://github.com/zyyu1/personal-workspace/issues/12
- **Historical Draft PR #11:** Original 2-minute scheduler proposal was replaced by an on-demand V1.1 revision, which is now superseded by the approved frozen design on `main`. Do not merge historical draft contents.
- **User-facing interaction:** Design Window publishes a duly authorized GitHub notification; **user explicitly clicks one Windows receive shortcut** (or triggers the equivalent one-shot local command); receiver validates/fetches/submits at most once to original pinned Desktop Codex thread, then exits.
- **Honest trigger limitation:** With no local watcher, scheduler or separately proven remote-execution channel, posting a GitHub Issue from ChatGPT **cannot** automatically awaken Windows. V1.1 eliminates manual task-text copy/paste, not the one local click.
- **Notification policy:** `probe|notify` only; `implement` always rejected. B2A strict v2 types, frozen main record/handoff SHA, unique active authorization, local UUID, durable PREPARED, dedupe/UNKNOWN_DELIVERY and fail-closed checks remain required.
- **Current delivery status:** B2A one-shot original-thread ACK accepted by user-attested observation. Original Issue #10 CLOSED, consumed approval revoked; Outbox must be preserved.
- **B2B code:** NOT STARTED / QA PENDING / PR NOT SUBMITTED as of this decision.
- **Windows shortcut:** NOT INSTALLED; separately approve disabled/local host staging after code QA.
- **B2B pilot:** NOT AUTHORIZED / NOT RUN; requires a *new* approved harmless notification and separate operator-controlled host test after code QA.
- **B2B everyday use:** NOT ENABLED; requires future user opt-in after pilot.
- **B3:** NOT AUTHORIZED. Modules 007/008 implementation remains outside B2B; Module 008 blocked by Module 007 independent QA.
- **Next action:** Existing Windows Codex development window reads Issue #12 and both approved source-of-truth documents, develops only code + mocks on new `codex/dispatch-b2b-on-demand` branch, requests independent Review Only QA and stops without merge or real send.

**No background process, periodic listener or live Codex queue was activated by the B2B V1.1 design confirmation.**

## B2B V1.1 Remediation Revision 01 — Code QA REJECTED (2026-11-21)

- **Design authority:** `docs/dispatch/B2B_ON_DEMAND_DESIGN_APPROVED.md` (on-demand one-click, **not** background polling).
- **Original code-only work order:** https://github.com/zyyu1/personal-workspace/issues/12
- **Code PR:** https://github.com/zyyu1/personal-workspace/pull/13 — current original QA-reviewed HEAD `650ef85dce0549602ba20bd2d8f10835ee219e70`, initial implementation `ec884bae8dab9eb3b8b5c11f3310260796f8f309`, OPEN/UNMERGED at review.
- **Independent QA:** https://github.com/zyyu1/personal-workspace/pull/13#issuecomment-7064833121 — **REJECTED**, High `B2B-QA-001`; QA matrix #11/#15/#16 FAIL, #28 NOT VERIFIED. Python 102/102 and Workspace 104/104 PASS did not include the missing adversarial coverage.
- **Root cause:** `b2_on_demand._authorized_snapshot()` discarded the `NotifyResult(status="BLOCKED")` for a per-issue record/handoff read error; one valid Issue plus one unreadable Issue became a false singleton and could proceed through PREPARED/sender. QA independently reproduced sender=1 and state created. Applies to discovery and lock-internal fresh recheck.
- **Formal authorized remediation:** [`docs/dispatch/B2B_ON_DEMAND_REMEDIATION_REV01.md`](https://github.com/zyyu1/personal-workspace/blob/main/docs/dispatch/B2B_ON_DEMAND_REMEDIATION_REV01.md). Entire snapshot fails closed on any BLOCKED/unknown/inconsistent validation; only true policy REJECTED may be skipped. Adversarial record/handoff GET failures in both phases must prove sender=0 and outbox unchanged.
- **Allowed next action:** Development Window repairs the narrowly scoped finding **in same PR #13**, runs mock adversarial regression and requests new independent Review Only QA at a new exact HEAD. Design Window will separately decide acceptance/merge.
- **Safety gates:** No actual `codex queue`, no local shortcut installation, no scheduler/watcher/service/autorun, no B3 routing, no Module 007/008 application changes. B2A accepted one-shot, Issue #10 CLOSED and Outbox preserved.
- **Host QA matrix #28:** remains NOT VERIFIED until later explicit independent real-host stage authorization. Passing code QA alone will not enable any local receiver.

**Current authoritative B2B state:** V1.1 **on-demand** product design approved, candidate **REJECTED**, Revision 01 remediation authorized, **implementation not accepted or merged**, local activation not authorized.

## AUTOMATION PAUSE / HANDOFF CHECKPOINT — 2026-11-21

**User decision:** Pause all Personal Workspace automation development and resume the core Personal Workspace product build. This overrides the previously authorized B2B targeted repair work order *until further explicit user instruction*. It does not erase approval or historical QA evidence.

- **B0:** ACCEPTED — original Windows Codex Desktop thread targeting proved.
- **B1:** ACCEPTED — read-only GitHub inbox and Windows `cp936` operational smoke; B1 remains read-only and unaffected.
- **B2A:** CODE and single real supervised notification **ACCEPTED**; one exact ACK observed in original Desktop thread and explicitly confirmed by user; PR #9 MERGED; original Issue #10 CLOSED, approval removed, Outbox preserved; local `dispatch_enabled=false`.
- **B2B V1.0 periodic poller:** REJECTED by user, no scheduler / watcher / daemon / service.
- **B2B V1.1 one-click on-demand:** frozen design approved at `docs/dispatch/B2B_ON_DEMAND_DESIGN_APPROVED.md`. Development PR #13 HEAD `650ef85dce0549602ba20bd2d8f10835ee219e70` independently QA REJECTED for High `B2B-QA-001`; Remediation Rev01 `docs/dispatch/B2B_ON_DEMAND_REMEDIATION_REV01.md` published but **NOT REVERIFIED**. No code merge / Windows launcher install / real queue permitted; no further development during pause.
- **Pause records:** https://github.com/zyyu1/personal-workspace/issues/12#issuecomment-7064891931 and https://github.com/zyyu1/personal-workspace/pull/13#issuecomment-7064892485.
- **B3:** NOT AUTHORIZED. A B2 notification never grants implementation rights.
- **Next active project priority:** **Module 007 — Study Workspace / Course Overview V1.0 + Course Materials Folder/ZIP index**; `docs/handoffs/007/STATUS.md` says Design APPROVED, A01 gate READY, Implementation NOT STARTED, QA PENDING, implementation instruction published. **Module 008:** design approved but blocked by accepted 007 implementation + independent QA.
- **Resume automation only:** user issues new explicit authorization; verify current PR #13 HEAD, do the scoped B2B-QA-001 fail-closed repair + adversarial regression on the same branch, get independent Review Only QA, then Design Window reviews and separately authorizes any code merge or Windows host deployment. Never restart periodic polling or replay Issue #10.

**GitHub notes do not remotely stop an actively running local Codex turn.** If a Windows development window was actively editing B2B, send this pause order there manually; do not confuse a GitHub comment with live cancellation.
