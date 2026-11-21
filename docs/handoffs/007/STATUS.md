# Module 007 Status

- **Module:** 007
- **Name:** Study Workspace — Course Overview V1.0
- **Design:** APPROVED
- **A01 Final Integration Gate:** READY FOR MODULE 007
- **Baseline:** `dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237`
- **Implementation:** **CODE ACCEPTED by independent QA** at `1c35753804e6b99f2dc620756e4a8dce70f7292c`; **NOT MERGED — PR #15 mergeable=false; STATUS.md branch conflict requires doc-only reconciliation**
- **QA:** **ACCEPTED FOR CODE** at `1c35753804e6b99f2dc620756e4a8dce70f7292c` — 23 PASS / 0 FAIL / 1 PARTIAL (real Windows directory picker host verification), independent QA https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065966274
- **Next Action:** **STATUS.md-only merge conflict reconciliation** in PR #15, preserve main QA audit and host PARTIAL, independently confirm documentation-only delta and new mergeable HEAD. Design Window then makes final merge decision; no Module 008/B2B/B3/Queue.
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

## Module 007 Revision 01 — Final Code Acceptance / Merge HOLD (2026-11-21)

- **Accepted reviewed CODE HEAD:** `1c35753804e6b99f2dc620756e4a8dce70f7292c`; PR https://github.com/zyyu1/personal-workspace/pull/15 remains OPEN / UNMERGED as observed.
- **Final independent QA:** https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065966274 — **ACCEPTED FOR CODE**, 23 PASS / 0 FAIL / 1 PARTIAL. All M007-QA-001..005 repaired; Calendar stale request and StrictMode wizard focus follow-up passed. Full regression 137/137 and Study 33/33; typecheck/build/diff PASS; lint 0 errors/12 previous warnings; actual 390×844/1024×768/1440×900 responsiveness PASS.
- **Design Window code decision:** https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7066003037 — **CODE ACCEPTED / MERGE HOLD**, not a full real-folder operational acceptance.
- **Outstanding host verification:** QA row #4 genuine Windows native directory picker/authorization is **PARTIAL**. It must remain explicitly pending. No Local Connector or persistent filesystem permission is claimed; a future separately supervised host check is needed.
- **GitHub technical merge gate:** PR #15 reported `mergeable=false`. Since PR base `febcc3429af0938b010e184d6b851fb226b59678`, main modified only `docs/handoffs/007/STATUS.md` and created `MODULE_007_REMEDIATION_REV01.md`. PR also changes `STATUS.md` but holds outdated `QA PENDING`. A one-file status reconciliation preserving historical decisions is authorized on same PR; **no source code edits or silent overwrite of main QA audit**.
- **Required final step:** updated PR HEAD + independently checked doc-only delta and GitHub mergeability; then return to Design Window for final scoped merge. The accepted code SHA remains the QA anchor. If conflict resolution introduces implementation changes, independent code QA must re-review those changes.
- **Dependent Module 008:** NOT STARTED / BLOCKED until Module 007 implementation is actually merged, accepted SHA/interfaces recorded and Design Window separately authorizes the next module; no automatic transition from code acceptance. B2B paused and B3/Queue not authorized.

The historical REJECTED candidate and Remediation authorization above remain preserved for audit purposes. This newer section is the current authoritative decision and does not retroactively relabel earlier failed candidates as passing.
