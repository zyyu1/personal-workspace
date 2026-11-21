# Module 007 Status

- **Module:** 007
- **Name:** Study Workspace — Course Overview V1.0
- **Design:** APPROVED
- **A01 Final Integration Gate:** READY FOR MODULE 007
- **Baseline:** `dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237`
- **Implementation:** INITIAL PR #15 SUBMITTED / INDEPENDENT QA REJECTED — Revision 01 remediation AUTHORIZED, not yet accepted or merged
- **QA:** REJECTED at `7a670f77848e752855dd277c7e9af5850b4006f2` — 17 PASS / 6 FAIL / 1 PARTIAL; new independent review pending
- **Next Action:** Same `codex/module-007` branch / PR #15: implement narrowly scoped fixes in `MODULE_007_REMEDIATION_REV01.md`, add adversarial/browser tests and request new independent Review Only QA. No merge or Module 008.
- **Document Sync:** COMPLETE

The historical Audit waiting statement in the Approved Design remains part of the frozen source and has not been edited. The final gate above and the formal Execution Instruction record that the implementation restriction has been lifted. Implementation remains NOT STARTED until the Development Window receives the separate start instruction.

## Module 007 Revision 01 — Design Window Security/UI Remediation (2026-11-21)

- **PR:** https://github.com/zyyu1/personal-workspace/pull/15 — OPEN / UNMERGED, initial reviewed HEAD `7a670f77848e752855dd277c7e9af5850b4006f2`
- **Original independent QA:** https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065436709 — **REJECTED**, 17 PASS / 6 FAIL / 1 PARTIAL
- **QA-001 HIGH:** unlinking Resource in one CourseOffering corrupts Entry in another CourseOffering; fix ownership scoping. Matrix #1 and #14.
- **QA-002 MEDIUM:** repeated mixed accepted/rejected manifest scans produce duplicate Entry IDs. Matrix #13.
- **QA-003 MEDIUM:** Study assessments missing from selectable Global Calendar UI. Matrix #18.
- **QA-004 MEDIUM:** Global Study Task and linked Resource navigation incorrectly points into Research. Matrix #17.
- **QA-005 MEDIUM:** 390px Timer Finish/Discard inaccessible; Material Wizard overflow and Escape/focus defects. Matrix #22.
- **Real Windows Folder permission:** QA #4 **PARTIAL**; requires genuine supported Windows/browser host evidence and cannot be fabricated by unit test; not proven as a code defect.
- **Formal remediation authority:** [`docs/handoffs/007/MODULE_007_REMEDIATION_REV01.md`](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_REMEDIATION_REV01.md), scoped code/test edits only, same PR #15, new independent Review Only QA required.
- **Passing original evidence to preserve:** 126/126 tests, typecheck/build/diff, lint 0 errors/12 existing warnings, ZIP adversarial boundaries, IndexedDB persistence/Continue restore, 1440/1024 baseline UI.
- **Merge and dependent gates:** no merge, no Module 008 implementation until accepted 007 implementation and explicit later Design Window acceptance; B2B workstream remains paused and no live Codex queue or background watcher is authorized.

The earlier historical “NOT STARTED” status above was superseded by the first PR #15 implementation submitted for QA. Current reality is **CANDIDATE REJECTED / TARGETED REMEDIATION AUTHORIZED / NOT MERGED**, not a successful implementation acceptance.
