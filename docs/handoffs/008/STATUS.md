# Module 008 Status

- **Module:** 008
- **Name:** Study Workspace — Course Learning Progress & Exercises V1.0
- **Design:** APPROVED / DESIGN FROZEN (confirmed 2026-11-21)
- **Design Source:** `docs/handoffs/008/DESIGN_APPROVED.md`
- **Execution Instruction:** `docs/handoffs/008/EXECUTION_INSTRUCTION.md`
- **Implementation:** NOT STARTED — **AWAITING SEPARATE DESIGN WINDOW START AUTHORIZATION**; Module 007 code QA accepted and PR #15 merged, but this does not auto-start Module 008
- **QA:** PENDING
- **Prerequisite:** Module 007 CODE ACCEPTED (source `1c35753804e6b99f2dc620756e4a8dce70f7292c`) / PR #15 MERGED (`cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`); actual exported/domain interfaces must be mapped against merged main before separate Module 008 implementation release. Module 007 native Windows folder-picker QA #4 remains PARTIAL (Issue #16).
- **Shared Platform Baseline:** `dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237` (A01 gate; NOT a substitute for 007 implementation baseline)
- **Next Action:** Design Window may separately authorize Module 008 interface-mapping/development only after checking the merged 007 canonical contracts and prerequisites. Until a new explicit start instruction, **NO Module 008 branch/code/QA execution**. Keep the Windows picker host QA independent and do not treat it as PASS.
- **Handoff Publication:** COMPLETE
- **Implementation Authorization:** **CONDITIONAL / NOT YET ACTIVE — NEEDS EXPLICIT DESIGN WINDOW START DECISION**

The approved UI/UX design is frozen. The handoff's presence on GitHub **does not** authorize starting 008 coding before 007 QA. The QA Window reviews implemented code independently, and the Design Window determines acceptance and authorization of subsequent modules.

## Dependency Update — Module 007 merged (2026-11-21)

- **Upstream code QA:** https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065966274 — ACCEPTED, 23 PASS / 0 FAIL / 1 PARTIAL.
- **Accepted code HEAD:** `1c35753804e6b99f2dc620756e4a8dce70f7292c`.
- **Upstream merge:** https://github.com/zyyu1/personal-workspace/pull/15, merge commit `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`. Implementation code is present on main.
- **Distinct outstanding host gate:** https://github.com/zyyu1/personal-workspace/issues/16 — genuine Windows folder picker/permission remains PARTIAL. No assertion of 24/24 PASS.
- **Module 008:** Design frozen but **NOT STARTED**; no implementation branch, code or independent QA authorized by this status update. Before any start decision, review the accepted 007 Course/CourseOffering/Resource/Task/Assessment APIs in merged main and reconcile any discrepancies with Module 008's approved design.
- **Other workstreams:** B2B paused; B3 and real Codex Queue not authorized. No automatic implementation dispatch.

This is a dependency-state correction only; it does **not** activate the earlier conditional execution instruction.
