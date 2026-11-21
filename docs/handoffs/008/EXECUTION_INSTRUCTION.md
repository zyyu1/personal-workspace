# PERSONAL WORKSPACE — 增量执行指令 008

## Study Workspace — Course Learning Progress & Exercises V1.0

**Design:** APPROVED / DESIGN FROZEN (2026-11-21)  
**Authority:** `docs/handoffs/008/DESIGN_APPROVED.md`  
**Execution status:** **PREPARED / BLOCKED — DO NOT CODE until Module 007 independently QA ACCEPTED**  
**Reference project:** `zyyu1/personal-workspace` (private)  
**Dependency:** Modules 001–006 and A01-1/2/3 shared services; Module 007 Course Overview + Materials; global InspectorShell / Tasks / Calendar / Timer / Resources.  
**Deliverables:** Study Progress and Exercises UI, scoped canonical records, persistence/migration, 007 Overview projections, tests, browser validation, independent QA handoff.  
**Scope rule:** Implement only Module 008; no automatic start of 009/010.

> **Implementation gate (mandatory):** This document is published now so the next module can be prepared while 007 is built. It is *not* authorization to start 008 coding while 007 is unaccepted. Development window must verify the current `docs/handoffs/007/STATUS.md`, independent QA report, and accepted 007 implementation commit. If absent, report **BLOCKED BY MODULE 007** and stop. Do not fill the gap with new mock course/material implementations. Once 007 is accepted, use the real code and its contracts (not imagined APIs) as base. Any material conflict with this frozen design must return to Design Window for a separate change decision.

## 0. Before coding: prerequisite, baseline, OSS research

1. Read `docs/handoffs/008/DESIGN_APPROVED.md` fully, especially ``3–9 and 30-point acceptance matrix.
2. Read `docs/handoffs/007/DESIGN_APPROVED.md`, `EXECUTION_INSTRUCTION.md` and `STATUS.md`, and independent Module 007 QA acceptance evidence. Distinguish a ready design from an implemented and accepted feature.
3. Verify Git branch/HEAD/working tree, remote, and accepted Module 007 commit. Start a fresh `codex/module-008` branch **from the accepted 007 code baseline**, never from a stale A01 commit. Preserve unrelated changes, never force-push or use hard reset.
4. Inspect actual CourseOffering, CourseSection, CourseStudyProgress, CourseMaterialEntry, ResourceLink, global Task/TimeEntry/Resume and InspectorShell services. Document reusability, versioning and schema migration implications before changing code.
5. Check three GitHub references listed below against current repo activity/license/dependencies before copying any source; use as optional concepts, not another backend or framework.

| OSS candidate | Link | Stars in 2026-11-21 design snapshot | Recent observed commit | License | Stack and deployment difficulty | Reuse decision / risks |
| --- | --- | ---: | --- | --- | --- | --- |
| Saxermi/study_tracker | https://github.com/Saxermi/study_tracker | 0 (snapshot) | 2026-11-20 | MIT, LICENSE checked | Python + vanilla JS; Medium | Borrow course/exercise self-evaluation flows only; porting server logic and tiny community increase risk. |
| JStanoeva/course-tracker | https://github.com/JStanoeva/course-tracker | 1 (snapshot) | 2025-09-20 | MIT, LICENSE checked | React/TS/Vite + Supabase; Medium | UI/interaction reference only; backend and canonical models incompatible without redesign. |
| open-spaced-repetition/ts-fsrs | https://github.com/open-spaced-repetition/ts-fsrs | ~877 (snapshot) | 2026-11-19 | MIT, LICENSE checked | TypeScript package; Low–Medium | Future optional scheduling only. **Do not install or use FSRS in V1.0**, no inferred mastery or auto-generated review plans. |

## 1. Module scope and routes

Implement:
- `/study/courses/:courseOfferingId/progress`
- `/study/courses/:courseOfferingId/exercises`
- Deep links `?unit=<stableId>` and `?exercise=<stableId>`; optional `?set=<stableId>`.

Use the existing 007 Course Header, CourseOffering identity and tabs. Add functional Progress and Exercises tabs; show Exams, Labs, Notes as Future/disabled until implemented. Do not overwrite 007 Overview/Materials routes. Neither the user-selected file name nor a local Windows absolute path is an entity ID.

**Progress page**: compact counters (studied / tracked, self-rated confident / tracked, needs review, canonical study time), editable nested learning outline, outline/list toggle, search/filters, linked Resources/Notes/Tasks, unit Inspector. Outline order is user-controlled, not inferred by PDF filename. Use explicit Add Unit / Link Resource / Mark Studied / Create Task actions.

**Exercises page**: exercise sets (Übung/KGÜ/Tutorium/Other), tracked per-item codes such as `A1`, `A2(a)`, `A2(c)`, item state, attempts, review queue, search and filters, item Inspector, actions to log attempt, mark solved/blocked, flag review, create retry Task, open available original material.

Use shared InspectorShell: desktop panel, tablet drawer, 390px fullscreen, Escape + focus return, deep-link dismissal. List cards on mobile, no horizontal overflow or swipe-only essential actions.

## 2. Canonical domain entities (avoid duplicate stores)

Add only the entities absent from the QA-accepted 007 implementation:
- **CourseLearningUnit**: offering ID, parent, title/code/order, archive, includeInCoverage, timestamps. Hierarchy within same offering; reject cycles and cross-offering parent.
- **CourseExerciseSet**: offering ID, kind, code/title, optional unit and existing Resource relationships, active/archived.
- **CourseExerciseItem**: offering/set ID, normalized item code, optional confirmed source pointer, optional unit, display order, coverage flag, archived marker.
- **CourseExerciseAttempt**: stable attempt ID, item/offering IDs, attemptedAt, outcome, user notes/mistake tags/difficulty, optional Note ID; retain history, explicit correction/revision.
- **CourseStudyProgress**: **extend 007's canonical entity**, one record per (offeringId, targetType, targetId). Target types = resource/learning-unit/exercise-item; preserve all 007 resource-level studied/reviewed data during schema evolution.
- **StudyEvidenceLink**: prefer existing ResourceLink/EntityRelation. Only introduce a minimal relation type if existing contracts cannot safely represent the needed offering-scoped link.

Source-of-truth separation: 007 owns Course/CourseOffering, source manifest/material records and material classification; global services own Resource, Task, PlannedSession, TimeEntry, Resume Context. 008 owns actual tracked learning-unit and exercise definitions/attempts. Do not repurpose 007 CourseSection virtual file categories as curriculum topics.

Stable IDs must come from existing generators; foreign keys checked; resource identity stays stable across re-scan/missing files. Multiple CourseOfferings for one Course must have independent learning/attempt/progress data even when they reference the same global Resource.

## 3. Status axes and permitted behavior

**Learning unit:**
- `studyState` = `not_started | in_progress | studied` (manual only).
- `masteryState` = `unassessed | needs_review | practicing | confident` (manual self-rating, not grade).
- `needsReview` Boolean plus optional `reviewOn`, `lastReviewedAt`. Orthogonal to study/mastery.
- User can reopen a studied unit, retaining history. Mark Reviewed clears review flag only with explicit action; does not mark Confident.

**Exercise item:**
- `solveState` = `not_started | in_progress | blocked | solved` (manual; solved is a self-claim).
- `needsReview` Boolean independent from `solveState`; solved+needsReview is allowed.
- Attempt `outcome` = `unknown | incorrect | partial | correct` (user evaluation of this attempt only).
- Incorrect attempt, reading a solution PDF, opening material, timer finish, or completed Global Task **does not** silently change solved, unit mastery or course progress.
- Append attempts separately; retry after Solved allowed. Make Mark Solved idempotent; concurrent attempt creation must preserve all distinct records.

**Set/source:** Archive retains progress/attempts/notes/task links. Missing/offline/unavailable 007 Resource never deletes learning records or makes original file falsely openable. Destructive deletion without explicit retention design is out of scope.

## 4. Accurate progress calculations and evidence

No global artificial “Course complete %.” Show numerator/denominator and “based on tracked units/items”.

**Unit coverage:** U = unarchived leaf learning units with includeInCoverage=true; standalone parent with no children counts once. Studied = count(studyState=studied in U). Coverage = Studied / |U| only if |U|>0. Self-rated confident = count(masteryState=confident in U), separately. A parent with children cannot count again.

**Exercises:** E = active (non-archived), includeInCoverage=true tracked exercise items. Attempted = count(items with ≥1 explicit attempt OR solveState ∈ {in_progress, blocked, solved}); Solved = count(solveState=solved). AttemptRate=Attempted/|E|, SolvedRate=Solved/|E|, only if |E|>0. ToRetry = set union of needsReview=true and solveState=blocked (one item counted once). An individual correct attempt ≠ solved item.

If denominator is absent show “Not configured” or “No exercises tracked”, never 0% complete. Count only explicitly tracked items, not imported PDFs. Course Overview 007 Learning Progress must read the 008-derived CourseProgressQuery, not maintain a second mutable summary. Resource-level 007 Mark Studied does not mark every Unit studied. Time spent comes from global canonical TimeEntry (precise seconds), not attempts or file opens. Review date is not exam deadline.

## 5. Contract integration and workflows

1. **007 Materials → Exercise Set**: Existing Übung/KGÜ resource → user chooses Track exercises → review suggested set/items → explicit confirmation → save stable Set/Item and existing Resource link. File-name-derived suggestions are not verified PDF content and never auto-complete questions.
2. **Exercise → Task → Calendar → Timer**: Create “Retry A2(c)” via GlobalTaskService, with Study primary ownership and offering+item relation; optional DailyTaskAssignment/PlannedSession; TimeEntry created only by Global Timer Finish. Rescheduling must not affect Due Date or CourseAssessment deadline.
3. **Unit → Resume**: Register stable Unit/Item route and ID in WorkspaceResumeContext after explicit activity. Course Overview Continue Studying validates entity and restores context after refresh without starting Timer. Invalid/missing entity uses safe course-level fallback.
4. **Across semesters**: CourseOffering A/B may share Resource IDs; never share progress or attempt histories automatically. Copying definitions to another offering (optional) requires user confirmation and excludes previous progress/attempts.
5. **007 Re-scan**: CourseMaterialSource / Resource availability may change without erasing existing learning records; use 007 Locate/Repair. Resource availability is per current device.
6. **007 CourseStudyProgress compatibility**: read existing 007 progress record shapes and actual migration version; safely evolve existing progress repository with backups. Never create a second independent status table to evade migration.

## 6. Persistence and write safety

- Reuse A01-1 accepted IndexedDB Versioned Repository / PersistenceAdapter, migration backups and typed MutationResult; avoid module-level mutable arrays and ad hoc localStorage stores.
- Validate foreign keys and offering ownership at service boundary; normalize itemCode but retain display code; uniqueness of active (setId,normalizedCode), allowing explicit disambiguation only if fully specified and tested.
- Concurrent same-item create must dedupe **inside** a serialized repository mutation; concurrent different attempt logs must both persist. Repeated Mark Solved should not duplicate records.
- Writes must only update cache after durable write; true failure must show retry/error, not false success. Cross-repository transactions are not globally atomic: surface partial results and reconcile where relevant.
- Migration: retain 007 resource-level progress and linked identities, backup before change, safe fail on higher schema/missing migration, no silent seed reset. New seed cannot overwrite user's data.
- File link/unlink never deletes source PDF/Markdown. Unavailable original remains metadata-only. No direct browser access to arbitrary Windows paths/Typora without an actual authorized connector.

## 7. States, visuals, interaction

- Warm Beige tokens: Background #F7F3ED, Card #FFFDF9, Secondary #F1E9DD, Border #DED3C4, Text #30281F, Secondary #6E6154, Accent #77573B.
- Reuse AppShell, Course Header/Tab, InspectorShell, global filters/actions, Loading/Error/Empty.
- At 1440/1024/390 validate accessibility, focus, Escape, route deep links, touch targets, and horizontal overflow.
- Empty states: No learning units, No tracked exercises, Review queue empty, No meaningful denominator.
- Failure states: Persistence failed, Permission Required, Resource Another Device, Missing Source, Archived target, Unknown CourseOffering, Migration failed. Loading must not spin indefinitely after an error.
- No fictional study grades, NLP/PDF parsing claims, AI mastery, automatic schedule or real Typora process launch.

## 8. Implementation sequence (after 007 accepted)

A. Record accepted 007 commit, existing schema/interfaces and Git baseline. Report any mismatches and stop for design decision if material.  
B. Model + Repository contracts + migration of canonical CourseStudyProgress; tests for 007-data preservation.  
C. Learning outline, unit Inspector, explicit progress axes.  
D. Exercise Set/Item/Attempt and review queue, service idempotency tests.  
E. Canonical query/progress denominators; surface in 007 Overview without copying state.  
F. Connect Resource, Task, Calendar, Timer/TimeEntry and Resume; tests for paths and device availability.  
G. Responsive and accessibility checks; regression 001–007; independent QA handoff.

## 9. Acceptance matrix — all 30 items required

1. Progress route loads the correct CourseOffering without semester leakage.
2. Exercises route loads the correct CourseOffering, future tabs remain clearly disabled.
3. Outline supports create/rename/reorder/nest/archive, stable IDs, cycle prevention.
4. Parent and leaf units are not double-counted.
5. Empty outline shows Not configured instead of fabricated 0%.
6. Imported Materials cannot auto-create studied units.
7. Existing 007 Resource links to Unit without copying file bytes/identity.
8. Missing/permission-denied Resource does not erase history.
9. Study state independent from mastery.
10. Review flag independent from study/mastery.
11. Resource open / logged time never implicitly marks a Unit studied.
12. Exercise Set links a real 007 Übung/KGÜ Resource.
13. Item identity stable: `A2(a)` and `A2(c)` remain distinct.
14. Concurrent duplicate item creation does not create duplicate active records.
15. Attempts persist through solve-state changes and retries.
16. Incorrect attempt does not auto-change mastery or official grades.
17. Explicit Solved/Blocked/In Progress statuses persist.
18. Solved and review flag coexist; queue deduplicates.
19. Attempt/Solved rates use active tracked items only.
20. Missing denominator shows Not configured.
21. 007 Course Overview queries 008 canonical progress summary.
22. Resource-level 007 Mark Studied does not complete all Units.
23. Study/retry Task uses one Global Task ID and appears across views.
24. PlannedSession does not change Due Date/official Assessment.
25. Timer Finish writes exactly one TimeEntry, not auto-solve.
26. Resume deep-links to valid Unit/Item without auto-start Timer.
27. Refresh persists Units, Sets, Items, Attempts, Progress, review flags.
28. 007 resource progress survives migration and source re-scan.
29. At 1440/1024/390, core actions, Inspector ESC/focus, no overflow.
30. Existing 001–007 regression and Typecheck/Lint/Build/Tests truthfully reported.

Use `PASS / PARTIAL / FAIL / NOT VERIFIED` for each. Never assert tests or external app operations not actually run.

## 10. Explicit non-goals

Do not implement: Module 009 Exams/Past Paper workflow; Module 010 Labs/Notes complete business system; automatic FSRS scheduler, AI grading, PDF exercise extraction/OCR, unrestricted local folder access, backend/cloud sync, duplicate Resource/Task/Time store, large CSS refactor, new framework/backend, auto-import of LMS credentials, auto-generated official assessments. No destructive delete of original course files.

## 11. Development → independent QA → design review

After Module 007 has independent QA ACCEPTED and this work is implemented, deliver in GitHub PR (not directly to `main`):
- Branch/commits and accepted 007 baseline.
- Files changed and domain-schema/migration notes.
- Explicit mapping to 30 acceptance checks.
- Test commands/exits and browser evidence at target widths.
- Cross-semester isolation, review queue, attempt concurrency, 007 migration preservation and current-device Resource checks.
- Known limitations, unverified tests, remaining issues, screenshots if possible.
- A `QA_HANDOFF.md` and PR link for independent QA. QA window is **Review Only**, must not edit implementation. QA decision: `ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE`.

The QA report returns to Design Window. Only after Design Window accepts may implementation be merged or Module 009 authorized. If 007 QA remains pending, **STOP AFTER READING THESE DOCUMENTS**, return `BLOCKED BY MODULE 007`, and do not start coding.
