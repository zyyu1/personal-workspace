# Module 008 Status

- **Module:** 008
- **Name:** Study Workspace — Course Learning Progress & Exercises V1.0
- **Design:** APPROVED / DESIGN FROZEN (confirmed 2026-11-21)
- **Design Source:** `docs/handoffs/008/DESIGN_APPROVED.md`
- **Execution Instruction:** `docs/handoffs/008/EXECUTION_INSTRUCTION.md`
- **Implementation:** **IMPLEMENTED / PR CANDIDATE PREPARED** on `codex/module-008`; implementation commit `f5c5b003fe979eb5d253f075f660c771ee2c928a`. Awaiting independent Review Only QA and Design Window disposition; not merged.
- **QA:** PENDING — developer self-check is not acceptance. See `QA_HANDOFF.md`.
- **Prerequisite:** **FULFILLED** — Module 007 code accepted at `1c35753804e6b99f2dc620756e4a8dce70f7292c`, PR #15 MERGED `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`, native Windows folder-picker Rev03 independently ACCEPTED, matrix **24/24 PASS**, Issue #16 CLOSED. Accepted actual 007 interface map documented in `MODULE_008_START_AUTHORIZATION.md`.
- **Shared Platform Baseline:** `dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237` (A01 gate; NOT a substitute for 007 implementation baseline)
- **Next Action:** Interactive Windows Development Window reads frozen 008 design, execution instruction, explicit Module 008 start authority and actual 007 interface map; verifies clean accepted main; implements **only Module 008** on a fresh `codex/module-008` branch; submits PR+QA handoff, then stops for independent Review Only QA. No automatic Windows dispatch.
- **Handoff Publication:** COMPLETE
- **Implementation Authorization:** **ACTIVE FOR MODULE 008 CODE ONLY** — `MODULE_008_START_AUTHORIZATION.md` and Issue #17. No source edits or execution have occurred in this Design Window; no QA/merge or Module 009 authority.

The approved UI/UX design is frozen. The handoff's presence on GitHub **does not** authorize starting 008 coding before 007 QA. The QA Window reviews implemented code independently, and the Design Window determines acceptance and authorization of subsequent modules.

## Dependency Update — Module 007 merged (2026-11-21)

- **Upstream code QA:** https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065966274 — ACCEPTED, 23 PASS / 0 FAIL / 1 PARTIAL.
- **Accepted code HEAD:** `1c35753804e6b99f2dc620756e4a8dce70f7292c`.
- **Upstream merge:** https://github.com/zyyu1/personal-workspace/pull/15, merge commit `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`. Implementation code is present on main.
- **Distinct outstanding host gate:** https://github.com/zyyu1/personal-workspace/issues/16 — genuine Windows folder picker/permission remains PARTIAL. No assertion of 24/24 PASS.
- **Module 008:** Design frozen but **NOT STARTED**; no implementation branch, code or independent QA authorized by this status update. Before any start decision, review the accepted 007 Course/CourseOffering/Resource/Task/Assessment APIs in merged main and reconcile any discrepancies with Module 008's approved design.
- **Other workstreams:** B2B paused; B3 and real Codex Queue not authorized. No automatic implementation dispatch.

This is a dependency-state correction only; it does **not** activate the earlier conditional execution instruction.

## User-Specified Sequencing — Finish Module 007 Host QA First (2026-11-21)

- User explicitly directs: **complete Module 007's remaining native Windows picker acceptance before initiating Module 008**.
- Module 007 real-host QA authority and evidence collection: [host instruction](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_WINDOWS_PICKER_HOST_QA_INSTRUCTION.md), [Issue #16](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7066306276).
- **Module 008 implementation: NOT STARTED / WAITING FOR M007 HOST QA FINAL DESIGN WINDOW DISPOSITION.** Independent host evidence must be reviewed; any remaining PARTIAL must be explicitly resolved or separately accepted by the user/Design Window, never silently upgraded to PASS.
- After that, Design Window must verify actual merged Module 007 interfaces against Module 008's frozen design and separately authorize any 008 execution. This section **does not authorize development today**.

## Host QA Revision 02 Hold — Module 007 Before 008 (2026-11-21)

- [Module 007 Issue #16](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067039504): first real Windows host test was **FAIL** on the `%TEMP%` fixture due to Chrome standard system-files safety restriction, not a proven Module 007 code defect. Independent QA classified the entire host gate as **PARTIAL**.
- One narrowly scoped [Module 007 Windows Host Retest Revision 02](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_WINDOWS_PICKER_HOST_QA_RETEST_REV02.md) has been authorized for a disposable child under a safe local Documents directory, with original browser security and no fallback path or repeated retries.
- **Module 008 remains NOT STARTED / NO IMPLEMENTATION AUTHORIZATION** while this final Module 007 host gate is unresolved. The user requested 007 closeout first. Even if Revision 02 succeeds, new independent host QA, Design Window final disposition, accepted merged 007 interface mapping and a **separate 008 start instruction** are still mandatory.
- No B2B/B3 or real Codex Queue activation.

## Rev03 Host QA Atomic-Retry Hold (2026-11-21)

- [Module 007 Issue #16](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067278721): Revision 02 host QA did not reach browser due to execution-window JavaScript-to-PowerShell escaping/interactive-queue error; independent QA rejected the reported root cause, and the operator corrected it. **M007 matrix #4 stays PARTIAL**.
- Design Window authorized [single atomic .ps1 Rev03 host retest](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_WINDOWS_PICKER_HOST_QA_RETEST_REV03.md), no code modifications or additional privileges. Await operator positive browser proof and independent QA.
- **Module 008 implementation remains NOT STARTED / NOT AUTHORIZED.** User requested final disposition of Module 007 host acceptance before Module 008, and an additional explicit interface-mapped 008 start gate remains necessary even after Rev03.
- No B2B/B3 or real Codex Queue, scheduler, resident service or background automation.

## Module 008 Explicit Development Release — AFTER Module 007 Final Acceptance (2026-11-21; CURRENT)

- **Module 007 final operational acceptance:** https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7068768746 — Rev03 genuine Windows native-picker positive manual workflow independently QA ACCEPTED (https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7068589496), matrix #4 PASS; overall **24 PASS / 0 PARTIAL / 0 FAIL**. Issue #16 CLOSED. Earlier Rev01/Rev02 negative reports and limitations remain auditable; some post-grant steps were operator-attested rather than DOM-captured.
- **Accepted upstream code:** PR #15 merged to main as `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`, accepted code anchor `1c35753804e6b99f2dc620756e4a8dce70f7292c`.
- **Formal new 008 implementation permission:** [`MODULE_008_START_AUTHORIZATION.md`](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/008/MODULE_008_START_AUTHORIZATION.md), [Issue #17](https://github.com/zyyu1/personal-workspace/issues/17) — **START AUTHORIZED FOR CODE ONLY**, subject to development window clean latest-main checkout, source-of-truth 007 interface review, safe v1 Study data migration, frozen 30-point acceptance and independent QA. Frozen DESIGN_APPROVED/EXECUTION_INSTRUCTION unchanged.
- **Actual interface map completed by Design Window:** `StudyCourseService`/`StudyState` v1 canonical resource-level `CourseStudyProgress`, Resources/Tasks/TimeEntry/Resume, App/CourseWorkspace/StudyTabs; 008 design's new Units/Sets/Items/Attempts are permitted extension points. Developer must still report practical migration sketch before coding, and STOP for genuinely material interface conflict.
- **Module 008 actual state:** No coding or separate QA has begun in this design decision. **Development authorized; implementation PENDING**. Separate branch `codex/module-008` and PR+independent Review Only QA required. No merge until new explicit Design Window acceptance, no Module 009.
- **Other workstreams:** B2B paused/on-demand only; B3 and real Codex Queue NOT AUTHORIZED. GitHub publication does not wake the Windows computer or Codex Desktop.

All earlier `NOT STARTED / BLOCKED` statements are historical records from before Module 007 host QA and this separate authorization; they are superseded only as to **permission to begin Module 008 coding**, not as to actual code/QA completion.
