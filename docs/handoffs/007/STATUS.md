# Module 007 Status

- **Module:** 007
- **Name:** Study Workspace — Course Overview V1.0
- **Design:** APPROVED
- **A01 Final Integration Gate:** READY FOR MODULE 007
- **Baseline:** `dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237`
- **Implementation:** **MERGED INTO `main` / CODE ACCEPTED** — PR #15 merge `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`; accepted source HEAD `1c35753804e6b99f2dc620756e4a8dce70f7292c`, doc-only reconciled HEAD `35dd5e9417a2e711cd659c9b85b953a75f4f865f`.
- **QA:** **ACCEPTED FOR CODE** at `1c35753804e6b99f2dc620756e4a8dce70f7292c` — 23 PASS / 0 FAIL / 1 PARTIAL (real Windows directory picker host verification), independent QA https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065966274
- **Next Action:** Module 007 code delivery complete. **Host acceptance gate #4 remains PARTIAL**, tracked at Issue #16; do not claim Windows folder picker PASS until a separately authorized real-host verification. Module 008 implementation requires a new explicit Design Window decision; no B2B/B3/Queue.
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

## Module 007 Final Merge Acceptance — 2026-11-21 (CURRENT)

- **Code QA ACCEPTED at source HEAD:** `1c35753804e6b99f2dc620756e4a8dce70f7292c` — https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065966274. 23 PASS / 0 FAIL / **1 PARTIAL**, full 137/137 tests, Study 33/33, typecheck/lint/build/diff PASS and responsive browser checks at 390×844, 1024×768 and 1440×900.
- **Conflict resolution independently CONFIRMED:** https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7066219520 — one `STATUS.md`-only commit after accepted code, reconciled HEAD `35dd5e9417a2e711cd659c9b85b953a75f4f865f`, no source/test/package/lockfile delta, final merged STATUS blob preserved historical audit and host PARTIAL.
- **Final GitHub merge:** https://github.com/zyyu1/personal-workspace/pull/15 — **MERGED** to main on 2026-11-21, merge commit `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`, GitHub confirmed merged. No bypass of independent QA, no force push and no overwriting main's original REJECTED/Rev01 records.
- **Pending operational QA (separate):** Real Windows browser directory-picker and user folder authorization, **matrix #4 = PARTIAL / HOST VERIFICATION PENDING**, tracked by https://github.com/zyyu1/personal-workspace/issues/16. Browser fixtures/ZIP tests do not prove native Windows picker. This does not block the already-approved **code merge**, but it DOES prevent claiming 24/24 QA or full local-folder operational acceptance.
- **Module 007 implementation state:** **COMPLETE / MERGED / CODE ACCEPTED; HOST QA PARTIAL**. No new ZIP extraction, filesystem write or Local Connector claim authorized by this status.
- **Module 008:** No code started; the code acceptance/merge prerequisite is now met, but **implementation is NOT automatically authorized**. Separately confirm the accepted 007 domain interfaces and issue a new explicit Design Window start decision before any Module 008 work. Module 008's own status is authoritative for its approval gate.
- **B2B:** user-requested on-demand workstream remains paused; no periodic listener, scheduler, or automatic delivery was activated. **B3 / real Codex Queue:** NOT AUTHORIZED.
- All earlier rejection, remediation and merge-hold sections are retained as chronological history. **This most recent section supersedes their outdated point-in-time current status.**

## Module 007 Native Windows Folder Picker — Supervised Host QA Authorized (2026-11-21)

- **User order:** Complete Module 007 host acceptance **before** starting Module 008.
- **Exact new host QA authority:** [`docs/handoffs/007/MODULE_007_WINDOWS_PICKER_HOST_QA_INSTRUCTION.md`](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_WINDOWS_PICKER_HOST_QA_INSTRUCTION.md); tracking [Issue #16](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7066306276).
- **Permitted:** Supervised, disposable user-owned test folder, manual real Windows Edge/Chrome `showDirectoryPicker` user grant, index-only preview/confirmation, same-session IndexedDB reload, source SHA256 no-write check, documented cancellation/permission scenarios, sanitized operator evidence and **independent Review Only QA**.
- **Current evidence:** **NOT YET PROVIDED / MATRIX #4 STILL PARTIAL**. Host QA authorization does not imply real picker PASS. Full operational Module 007 acceptance and closure of Issue #16 require independent actual host QA and a Design Window final decision.
- **No permission:** No source edit, no automated native-picker interaction, no B2B/B3/Queue, no background service, and **no Module 008 implementation until this outstanding gate is resolved and separately authorized**.

## Module 007 Host QA Revision 02 — Restricted Non-TEMP Retest (2026-11-21)

- **Incident:** [original host FAIL](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7066983711): native picker opened on Windows 10 Chrome 157, but Chrome denied access to the instruction-mandated `%TEMP%` test directory as containing system files; user cancelled. No preview/confirm/IndexedDB positive workflow was observed.
- **Independent review:** [PARTIAL](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7066996820): report consistent with stop-on-failure and no safety violation; **matrix #4 remains PARTIAL / HOST VERIFICATION PENDING**. Do not rewrite the operator FAIL to PASS or claim 24/24.
- **New explicit user-supervised permission:** [Revision 02 non-TEMP host retest](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_WINDOWS_PICKER_HOST_QA_RETEST_REV02.md), [Design Window Issue #16 decision](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067039504): one finite real-browser attempt on a **new three-file disposable child of local non-synced Documents**. The designated parent must pass local/safe/non-reparse checks; if unsuitable or Chrome refuses again, STOP with no fallback.
- **No new implementation:** PR #15 remains MERGED / CODE ACCEPTED. No source edits, new PR, Local Connector, privileged filesystem access, background watcher, Queue, B2B/B3 or Module 008 development.
- **Pending next gate:** operator report with genuine grant, bounded preview, explicit Index-only confirmation, canonical Study Resource relationships, same-session IndexedDB reload, SHA256 no-source-mutation, followed by independent Review Only QA. Until Design Window accepts that evidence, Issue #16 stays OPEN and matrix #4 PARTIAL.

## Host QA Rev03 — Atomic .ps1 Retest Authorized (2026-11-21)

- **Rev02 outcome:** [operator PARTIAL](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067103548), [independent REJECTED](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067126158) and [operator correction](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067132536). The repository's original double-backslash regex **is valid**; the command was corrupted by a JavaScript template-string transport to interactive PowerShell and queued follow-on creation despite failed preflight. Browser/Vite were **NOT STARTED**, so positive Windows picker acceptance remains untested in Rev02.
- **Corrected narrow host QA authorization:** [Revision 03](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_WINDOWS_PICKER_HOST_QA_RETEST_REV03.md), [checked-out QA .ps1](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_WINDOWS_HOST_QA_FIXTURE_REV03.ps1), [Issue #16 formal scope](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067278721). One atomic real-file fixture invocation, explicit verified preflight **before** a single operator-supervised Chrome picker test. No JS source transport or queued PowerShell statements, no fallback path, no security-policy bypass.
- **Current matrix:** **23 PASS / 0 FAIL / 1 PARTIAL**. #4 is **HOST VERIFICATION PENDING**; Issue #16 OPEN. Not 24/24 PASS.
- **Independent QA required:** Revision 03 real Windows grant → preview → Confirm index only → canonical CourseOffering Resource/Entry/Inspector → same-session IndexedDB reload → unchanged 3-file SHA256; full operator report and independent Review Only evidence before Design Window acceptance/Issue closure.
- **Module 007 app code:** remains independent QA ACCEPTED/MERGED; test helper is documentation/test-only, NOT application feature code. **Module 008 NOT STARTED**, B2B paused, B3/Codex Queue unauthorized.
