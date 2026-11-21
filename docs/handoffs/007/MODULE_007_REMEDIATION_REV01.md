# Personal Workspace — Module 007 Remediation Revision 01

**Decision:** DESIGN WINDOW AUTHORIZED — NARROW CODE REPAIR + TESTS + INDEPENDENT REVIEW ONLY
**Date:** 2026-11-21
**Workstream:** Module 007 — Study Course Overview / Materials V1.0
**Repository:** `zyyu1/personal-workspace` (private)
**Original implementation PR:** https://github.com/zyyu1/personal-workspace/pull/15 — OPEN / UNMERGED
**Rejected candidate / exact reviewed HEAD:** `7a670f77848e752855dd277c7e9af5850b4006f2`
**Independent QA:** https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065436709 — **REJECTED**; 17 PASS / 6 FAIL / 1 PARTIAL
**Original work order:** https://github.com/zyyu1/personal-workspace/issues/14
**Authoritative design:** `docs/handoffs/007/DESIGN_APPROVED.md` on `main` (blob `0db4e8cba50fd735f5ce362eb667264d0d3422d1`); `docs/handoffs/007/EXECUTION_INSTRUCTION.md` on `main` (blob `61a427ceaa03b9ab869402b8a55fc40fdf3a3d6b`).
**Approval boundary:** Repair the five verified defects below **in the same `codex/module-007` branch and PR #15**. No merge, no Module 008, no B2B/B3, no real `codex queue`, no new background process, and no unrelated architectural redesign.

## 1. Design Window decision and evidence

Independent QA re-ran the existing 126/126 tests and verified typecheck/build/diff/lint (0 errors, 12 pre-existing warnings), ZIP traversal/security boundaries, 1440 and 1024 layouts, 390px baseline view, IndexedDB Resource/Task/TimeEntry persistence and Continue Studying. These passing gates are preserved but **do not supersede** the following failures:

| Finding | Severity | Affected matrix rows | Exact blocker |
|---|---|---|---|
| M007-QA-001 | **HIGH** | #1, #14 | Unlinking a shared Resource from one CourseOffering changes another Offering's Entry to missing with no resourceId |
| M007-QA-002 | MEDIUM | #13 | Repeated mixed accepted/rejected manifest rescan produces duplicate deterministic Entry IDs |
| M007-QA-003 | MEDIUM | #18 | Global Calendar cannot select Study Offering or assessment-deadline, despite service projection |
| M007-QA-004 | MEDIUM | #17 | Global Study Task/project/resource links route to Research rather than Study |
| M007-QA-005 | MEDIUM | #22 | 390px Timer Finish/Discard hidden; Import Wizard overflows and ignores Escape |
| Real Windows folder picker | **PARTIAL, not a code defect proven** | #4 | Browser-side manifest test passed, but native real Windows directory authorization/picker was not completed |

**Decision:** Reject candidate; authorize fixing **all five** verified software defects in one scoped revision. Keep real Windows picker row #4 **PARTIAL** until independent real-host evidence exists. Never claim a Local Connector or Managed Storage capability not implemented. QA #24 continues to require **zero Module 008 implementation**.

## 2. M007-QA-001 HIGH — strict CourseOffering isolation on unlink

**Location:** `src/features/study/services/studyCourseService.ts`, `unlinkResource`, originally lines 71–78.

The original code iterates **all** Study Entries matching `resourceId` and marks them missing even if they belong to a different CourseOffering. Required repair:

1. Identify the **exact source IDs** whose `courseOfferingId === offeringId` in the current Study repository state.
2. Update/remove only Entries whose `sourceId` is in that offering-owned set **and** `resourceId === resourceId`. Never touch entries from another Offering, even when both refer to the same canonical Global Resource.
3. For the selected Offering, delete the appropriate `source-existing-` manual link Entry (and treat associated source metadata safely), or mark imported source Entry `missing` as previously designed. Do not delete the global canonical Resource, another Offering's ResourceLink, progress, assessment or task.
4. Validate selected CourseOffering and relationship ownership before destructive operations; avoid false success on nonexistent IDs. Preserve existing A01 versioned repository contract, persistence and resource link semantics.
5. Tests: two offerings (Winter / Summer) linked to the same canonical Resource; unlink Winter; assert Summer `resourceId`, `status=available`, material relationship and canonical Resource remain byte/semantically unchanged. Then unlink Summer and verify no cross-offering side effects. Verify imported vs manually linked resources and refresh persistence.

**PASS criterion:** no cross-Offering state mutation or deletion, canonical Resource continuity and stable Offering isolation. Independent QA must reproduce original bug against original SHA and verify repair at new HEAD.

## 3. M007-QA-002 MEDIUM — idempotent mixed-manifest rescan

**Location:** `studyCourseService.ts`, `confirmManifest` originally lines 51–54.

A mixed manifest containing one safe indexed file and one rejected unsafe path currently retains the previous rejected row as `missing` and appends a new `rejected` row with the same deterministic ID. Required repair:

1. Determine present incoming paths/entry identities from **all manifest entries**, including rejected diagnostic entries; do not derive presence from `indexed` safe files alone. Respect normal file/directory roles and rejected items while preserving security rejection.
2. Implement a deterministic **one row per (`sourceId`, `relativePath`)** upsert/reconciliation. Existing rejected entries are **replaced/updated**, not simultaneously preserved as missing and appended again.
3. Retain one stable Entry ID and any valid user manual classification across ordinary rescans where applicable. Preserve correct `available`, `rejected`, `missing` outcomes: paths absent from a new manifest may become missing; currently rejected paths must remain rejected exactly once.
4. Do not promote unsafe paths to accepted resources, issue file reads/extracts, create fake Global Resource records or weaken ZIP traversal/symlink/size/compression/encoding defenses.
5. Tests: confirm mixed safe/traversal manifest twice and with path ordering changed; assert `entries.length === unique entry IDs`, no duplicate source/path keys, stable IDs and correct statuses/classifications. Test rejected→safe and safe→rejected transitions, removed path→missing, partial-failure diagnostic totals and persisted reload.

**PASS criterion:** repeated confirmation is idempotent at material Entry identity level, while retaining the Index-only security policy.

## 4. M007-QA-003 MEDIUM — verified Study assessments reachable from Global Calendar UI

**Locations:** `src/components/GlobalCalendarPage.tsx`, `src/services/globalCalendarService.ts`.

- The original Page always requests `projectId: 'adaptive-agents'`, and its project selector only presents Research. The Source selector lacks `assessment-deadline`, although the service can project verified Study assessments.
- Add a real Study Offering selection sourced from canonical `StudyCourseService.listOfferings()` **or** a genuinely implemented All Workspaces scope. Keep research calendar functionality unchanged.
- Make `GlobalCalendarService.query` use the selected scope correctly. Study-only query must not assume research-specific Planning/Submission snapshots exist for a Study Offering; do not silently discard Study data or fabricate research data.
- Expose the `assessment-deadline` source filter and `All sources` behavior; only `verified` assessments with an **actual** `officialDateTime` may appear. An unverified assessment, past-paper filename or missing date MUST NOT create a calendar deadline.
- Display and navigate each item to the owning Study CourseOffering (safely encoded route). Preserve canonical Assessment IDs, date precision/timezone, existing Research filters, month switching and other calendar sources.
- Tests: populate one verified dated Study assessment and one unverified/undated one; select Study Offering and Assessment source; assert exactly the verified event appears and Open Original routes to Study. Also test research calendar regression, All sources, scope change, loading/error/empty states.

**PASS criterion:** real Study assessment is discoverable and actionable through shipped Global Calendar UI without hidden service calls or invented dates.

## 5. M007-QA-004 MEDIUM — area-aware global Study Task/Resource navigation

**Locations:** `src/components/GlobalTasksPage.tsx`, `src/components/TaskInspector.tsx`, optionally a narrowly scoped routing helper.

- For `task.area === 'study'`, the task's `projectId` refers to a **CourseOffering**, not a Research project. Replace hard-coded `/research/projects/{projectId}/tasks` and `/research/projects/{projectId}/files` links with valid Study routes, `/tasks?task=<canonicalId>`, or an existing Global Resource URL that really resolves. Never create placeholders that route to a missing Study page.
- Inspector labels and helper text must be area-aware (Study course vs Research project); do not describe a Study Task as filtered into the current research project. Preserve existing Research routes, task editor/inspector and Task IDs.
- Use verified canonical routes rather than guessing a new Resource page. If no suitable Study Resource deep link is implemented, route to the existing safe global resource inspector/surface with a resolvable resource ID, or link back to offering Materials.
- Tests: a persisted Study Task with ResourceLinks, open from Global Tasks, verify task canonical ID, project/offering link and resource link resolve to Study/global resource—not Research; repeat for a Research Task to prove no regression. Reload and navigation state remain stable.

**PASS criterion:** task identity is unchanged; links/text reflect area and navigate successfully.

## 6. M007-QA-005 MEDIUM — 390px Timer and Import Wizard accessibility

**Locations:** `src/styles.css` mobile rules (notably original lines 240 and 454), `src/features/study/components/MaterialImportWizard.tsx`, and the existing canonical Timer UI only if necessary.

- At exact **390 × 844** viewport with an active Study Timer, **Finish & save** and **Discard** must both remain keyboard/touch-accessible, visibly reachable and operable. Do not hide both and leave an unfinishable running timer. Retain the canonical Timer/TimeEntry state transitions and persistence; do not add a duplicate timer model. At 1024 and 1440 preserve existing layout.
- The Import Wizard `role=dialog` must fit the viewport (including header, safe-area/scrolling and footer) without the reported `left 20 + width 390` overflow. Do not trap inaccessible buttons offscreen. The Wizard must close with Escape, restore focus appropriately, and follow the existing shared Inspector/dialog accessibility contract. Handle in-progress/pre-confirmation actions safely (avoid losing a committed import or claiming success on cancel).
- Test a real/browsable component at 390 × 844: start Timer → Finish/save and separately start → Discard; verify actual TimeEntry behavior. Open Wizard → Escape → closed and focus returned; verify keyboard controls and no document-level horizontal overflow. Verify at 1024 and 1440; check shared Inspector Escape remains functional.
- Any timer-specific CSS fix must not re-enable destructive buttons in unrelated contexts or break keyboard/ARIA.

**PASS criterion:** no hidden required Study Timer actions, no offscreen Wizard and Escape works with correct focus restoration.

## 7. Real Windows directory picker remains PARTIAL

- Original independent QA explicitly reported the real Windows directory permission/picker check **PARTIAL**. The in-browser bounded manifest / permission-required state was tested, but the independent QA environment did not complete the native picker dialog.
- Do not treat this as a confirmed software defect requiring bypassing OS permissions. Preserve user-initiated `showDirectoryPicker` support where available and explicit unsupported/permission-required states elsewhere. Avoid privileged directory scanning, local Connector claims, browser hacks or deceptive persistence.
- At Revision 01 **code QA**, mark row #4 **PARTIAL / HOST VERIFICATION PENDING** unless the independent QA actually completes a supported real Windows picker. A separate explicitly authorized host/browser test may close it later; **do not fabricate PASS**.
- In any case QA must preserve ZIP security and no extraction/overwrite behavior.

## 8. Approved file scope and forbidden work

**Allowed targeted edits:**
- `src/features/study/services/studyCourseService.ts` (unlink and manifest reconciliation);
- `src/services/globalCalendarService.ts` and `src/components/GlobalCalendarPage.tsx`;
- `src/components/GlobalTasksPage.tsx`, `src/components/TaskInspector.tsx` and narrowly needed existing routing helpers;
- `src/features/study/components/MaterialImportWizard.tsx`, the minimal `src/styles.css` responsive rules and existing canonical Timer surface only if essential;
- focused `*.test.ts[x]` regression/integration tests, and `docs/handoffs/007/MODULE_007_QA_HANDOFF.md` (append new Rev01 QA evidence). A small 007 runbook correction is permitted only if needed to explain revised behavior.

**Not allowed:** broad rewrite of A01 repository, other research modules, shared Task/Calendar/Timer persistence contracts, ZIP parser library/dependencies/security guards, frozen APPROVED design or execution instruction, Module 008 code, B2B repair, B3, Windows listener/scheduler, new live Codex queue call, unrelated GitHub authorization or any import/extraction operation beyond the approved metadata-only scope. If a necessary fix would change a frozen contract or require broad changes, STOP and return a design conflict for explicit review.

Check the **exact current PR #15 HEAD `7a670f77848e752855dd277c7e9af5850b4006f2`** before editing. Continue on the same `codex/module-007` branch and PR #15, add a normal remediation commit, preserve original rejected candidate and independent QA comment. **No force push, rebase/reset or merge.** Keep any other uncommitted user work safe.

## 9. Acceptance and independent Review Only QA

1. Developer implements **all five findings** and adds direct counterexample tests, including cross-Offering Resource isolation and repeated mixed-manifest ZIP diagnostics, plus responsive/browser integration. The High data loss must be fixed, not hidden by a disabled UI.
2. Report actual command outputs: `npm test -- --run` (baseline 126 tests preserved + new tests); `npm run typecheck`; `npm run lint` (0 new errors, 12 historical warnings); `npm run build`; `git diff --check`. Include exact filenames, new commit SHA and current PR HEAD. No invented PASS or counts.
3. Independent QA **Review Only**, at the new exact HEAD, must independently reproduce each original counterexample against the rejected SHA and verify correction at the new SHA, including **actual 390×844 mobile interactions**, Study Calendar/Task navigation, IndexedDB reload and full ZIP adversarial regression.
4. Reassess the **24-item Module 007 matrix**. Previously failing rows **#1, #13, #14, #17, #18, #22** must become PASS with direct evidence. Previously passing rows need regression protection. Row **#4 remains PARTIAL** until real Windows folder permission is directly tested. A review may distinguish **CODE ACCEPTED (host evidence pending)** from **FULL OPERATIONAL ACCEPTANCE**, but the independent QA must say so explicitly, never pretend 24/24 PASS.
5. Any new HIGH defect, any remaining code-level fail, ZIP security regression or cross-Offering data corruption => **REJECTED**. No merge before independent QA and a **new explicit Design Window acceptance**. If QA returns 23 PASS / 0 FAIL / 1 PARTIAL, Design Window must separately decide whether a **code-only merge with an explicit live-folder gate** is warranted; Module 008 remains blocked until Module 007 independent implementation acceptance under the approved dependency policy.
6. Return PR #15 URL, remediation commit SHA, new reviewed HEAD, file diff list, exact test results, independent QA comment URL and any still-partial host evidence. Developer and QA stop at this handoff.

### Non-negotiable gates

**PR #15 OPEN / UNMERGED; Module 007 INITIAL QA REJECTED; Revision 01 CODE REPAIR ONLY.**
**Module 008 NOT STARTED / BLOCKED BY MODULE 007 accepted independent implementation QA.**
**B2B V1.1 remains PAUSED, on-demand only by user preference; no background polling.**
**No real `codex queue`, no Windows installation/service/scheduler, no B3 automatic implementation.**

This instruction supersedes only the narrow remediation scope after the original 007 candidate rejection; the approved product design and all previously accepted A01 infrastructure remain authoritative.
