# Personal Workspace — Study Workspace / Course Learning Progress & Exercises V1.0

**Module:** 008  
**Status:** APPROVED / DESIGN FROZEN — user confirmed 2026-11-21; code implementation gated on Module 007 independent QA acceptance  
**Prepared:** 2026-11-21  
**Product baseline:** Personal Workspace V0.8 / Research Overview V1.1 warm Beige  
**Dependencies:** 007 Course Overview V1.0 APPROVED; A01-1/2/3 accepted; shared GitHub Handoff verified  
**Execution gate:** Module 008 design is approved for GitHub handoff now. Coding remains BLOCKED until Module 007 is implemented, independently QA ACCEPTED, and its accepted commit and contracts are verified. See `EXECUTION_INSTRUCTION.md` / `STATUS.md`.

## 1. Product goal and scope

Enable a learner to organize actual **learning units, exercise sets/items, learning evidence, mistakes and revisions** inside one `CourseOffering`, based on the course's existing indexed Materials, without confusing document management with learning completion. Support German university course structures: Skript/lecture chapters, Übung/KGÜ/Tutorium, exercise item codes (e.g., `A2(c)`), exercises to retry, and notes in Markdown/Typora. Reuse existing global Tasks, Calendar, Timer/TimeEntry, Resource IDs, WorkspaceResumeContext and InspectorShell.

**V1.0 must:** create and edit chapter/topic outlines, link existing Resources; track explicit study/review status per unit; create and track sets/items and attempts; view lists/filters, progress and a review queue; create global task/session/time associations; show evidence and progress in Course Overview; keep data local-persistent through the shared repository.

**V1.0 must not:** parse PDFs to infer solved questions, claim AI grading, infer knowledge from time or file opens, rewrite imported PDFs, build a new file/note store, duplicate Task or Resource records, implement a spaced-repetition scheduling engine, run automatic exam planning, build the full Exam/Past Paper/Lab modules (009/010), or automatically read/write Typora contents. Study sessions/actual time remain globally owned.

## 2. Navigation, page structure and layout

Existing 007 routes remain unchanged:
- `/study/courses/:courseOfferingId/overview` and `/materials` remain owned by 007.
- New `/study/courses/:courseOfferingId/progress` — Learning Progress and learning-unit outline.
- New `/study/courses/:courseOfferingId/exercises` — Exercise Tracker and review queue.
- Query deep links: `?unit=<stableUnitId>` and `?exercise=<stableExerciseItemId>` respectively; optional `?set=<stableExerciseSetId>` when selecting a set. No routing by raw file path.

Course tabs after implementation: `Overview | Materials | Progress | Exercises | Exams (future) | Labs (future) | Notes (future)`. Never show unimplemented tabs as if functional. Research/global navigation remains unchanged.

### 2.1 Progress page — desktop 1440px

```text
+ Global Sidebar + Course Header (course / term / status) --------------------+
| Course tabs: Overview | Materials | Progress* | Exercises | ...           |
| [Learning outline]   [Studied 6/12 units] [Needs review 3] [Study time]   |
| [Outline + filter]        [Unit list / Unit detail]       [Inspector]     |
| Ch. 1 Grundlagen         1.1 Signals   [Studied]  [Review]               |
|   1.1 Signals            1.2 Systems   [In Progress] ...                 |
|   1.2 Systems            1.3 LTI       [Not Started] ...                 |
| Ch. 2 ...                Resource / Note / Task links                      |
| [Add unit] [Link material] [Mark studied] [Create task]                    |
+-------------------------------------------------------------------------+
```

- Header: offering identity, source/term distinction, action `Add Learning Unit`, `Link Existing Material`; below: compact **Study coverage**, **Mastery evidence**, **Needs Review** and **Time spent** (no composite percentage unless denominator is meaningful).
- Left column (approx. 260px): editable outline tree, dragless `Move up/down` keyboard-friendly menu, nested topics; archive toggle and search.
- Main (fluid): section rows/learning units, study state, latest evidence, related Resources/Notes/Global Tasks. Alternate `Outline` and `List` views; sorted by user-defined order, not filenames.
- Right: shared InspectorShell (closed by default). Select unit to view notes, linked materials, study status, last reviewed, optional review date, task/time actions and history.
- No units: explain that 007 Materials are not automatically a course outline; offer `Create manually` or `Review Suggested Units` (only if a deterministic, reviewable proposal exists).

### 2.2 Exercises page — desktop 1440px

```text
+ Course Header + Tabs -----------------------------------------------------+
| [Tracked: 10] [Attempted: 7] [Solved: 5] [To retry: 3]                    |
| [All] [In progress] [Blocked] [To retry] [History]   Search / Filters      |
| Set / Sheet              Item Code     Status       Review    Actions       |
| Übung 04                 A1            Solved       —         Open          |
| Übung 04                 A2(c)         Blocked      Retry     Open          |
| KGÜ 05                   5.2           In Progress  Retry     Open          |
| [Create Set] [Add Item] [Create Task for Selected]                        |
+ Selected Item: Inspector (Attempts, resources, notes, next action) --------+
```

- Set navigation: by course section / Übung / KGÜ / Tutorium; filters by set, unit, status, priority, review flag, linked Task, resource availability.
- Table on desktop, cards on mobile. Item detail Inspector can show question code, source pointer (not PDF contents), attempt timeline, error tag, difficulty and follow-up.
- Primary actions `Start/Continue`, `Log attempt`, `Mark Solved`, `Mark Blocked`, `Flag for Review`, `Mark Reviewed`, `Create Task`, `Open Source` (only if available).
- Review queue is **explicitly flagged items**, not algorithmic flashcards or an auto-generated study plan. Can optionally assign a user-selected review date via a normal Global Task / DailyTaskAssignment.

### 2.3 Responsive 1024px / 390px

- At 1024px, outline collapsible and Inspector overlays as tablet drawer via shared shell; no table squeeze.
- At 390px, single-column `Overview / Outline / Exercises` controls; unit and exercise rows become cards; filters in accessible sheet; Inspector fullscreen; tabs scroll horizontally; all essential actions remain visible without swipe-only gestures.
- Target widths: 1440, 1024, 390; no horizontal overflow, keyboard focus restoration, clear loading/empty/error/offline states, touch targets at least ~44px.

## 3. Domain model and canonical ownership

**Never duplicate 007's `Course`, `CourseOffering`, `CourseMaterialSource/Entry`, `CourseSection` or global `Resource`/`ResourceLink`.** In 007, `CourseSection` may be used for material categorization; a new Study learning outline has a different meaning. Keep them distinct unless actual 007 code demonstrates that the existing model already supports genuine learning-topic hierarchy without a breaking semantic change.

| Entity | Suggested fields / ownership | Integrity requirements |
| --- | --- | --- |
| `CourseLearningUnit` | `id`, `courseOfferingId`, `parentUnitId?`, `title`, `code?`, `order`, `description?`, `includeInCoverage` (default true), `archivedAt?`, `createdAt`, `updatedAt` | Unit/topic hierarchical within one offering; no cycles; parent must be same offering; stable ID unaffected by rename/reorder |
| `CourseExerciseSet` | `id`, `courseOfferingId`, `title`, `setCode?`, `kind` (Übung/KGÜ/Tutorium/Other), `learningUnitId?`, `sourceResourceIds[]` (through existing links), `status` (active/archived), `order` | One set may link multiple 007 Resources; re-scan does not replace identity; code uniqueness only within offering if explicitly chosen |
| `CourseExerciseItem` | `id`, `courseOfferingId`, `setId`, `itemCode`, `title?`, `learningUnitId?`, `sourcePointer?` (page/section only if user confirmed), `order`, `includeInCoverage`, `archivedAt?` | Unique normalized `(setId,itemCode)` for active tracked items; separate `A2(a)` and `A2(c)`; user can keep distinct duplicate codes after explicit disambiguation |
| `CourseExerciseAttempt` | `id`, `exerciseItemId`, `courseOfferingId`, `attemptedAt`, `outcome` (unknown/incorrect/partial/correct), `notes?`, `mistakeTags[]`, `difficulty?`, `noteId?`, `createdAt` | Append-only history by default; correction creates explicit edit/revision; attempt record alone does not create TimeEntry |
| `CourseStudyProgress` (extend 007 canonical record, **do not create a parallel second store**) | `id`, `courseOfferingId`, `targetType` (resource/learning-unit/exercise-item), `targetId`, `studyState?`, `masteryState?`, `solveState?`, `needsReview?`, `lastStudiedAt?`, `lastReviewedAt?`, `reviewOn?`, `updatedAt`, `noteId?` | Exactly one current record per `(offering,targetType,targetId)`; discriminated fields by target kind; retain 007 resource-level studied/reviewed semantics and safely migrate existing records |
| `StudyEvidenceLink` (or existing EntityRelation/ResourceLink) | `courseOfferingId`, `targetType`, `targetId`, `resourceId?`, `noteId?`, `taskId?`, `relationRole`, `createdAt` | Prefer existing canonical relations; a link never duplicates Resource, Task or Note; unlink never deletes originals |

**Domain source of truth:** `CourseLearningUnit` owns outline; `CourseExerciseSet/Item` own exercise definitions; `CourseExerciseAttempt` owns attempt history; **one canonical progress repository** owns current state; global Task, TimeEntry and Resource services own their respective entities. Do not store authoritative progress values in 007 `CourseMaterialEntry` or a separate 008-only LocalStorage key.

**ID rules:** stable UUID/ID from the existing ID generator; do not use index, filename, absolute path or page number as global identity. Multiple `CourseOffering`s of the same `Course` never silently share progress, even if they link the same Resource ID. `StudyUnit/ExerciseItem` links in WorkspaceResumeContext use stable IDs and validate existence before opening.

**007 compatibility:** 007's `CourseStudyProgress` may already hold per-resource state. Extend/migrate with a backward-compatible target discriminator, preserving resource marked-studied/reviewed records. Avoid treating `CourseSection` material classification as a study unit. Use 007 `CourseResourceLink` and global `ResourceLink` for original documents. Before 008 implementation, QA-accepted 007 code is the source for exact names, repository boundaries and safe migrations.

## 4. Explicit statuses and transitions

### 4.1 Learning unit — separate study and mastery axes

| Axis | Values | Rules |
| --- | --- | --- |
| `studyState` | `not_started`, `in_progress`, `studied` | User explicitly changes. Opening a PDF, spending time or marking a Task Done never automatically marks unit Studied |
| `masteryState` | `unassessed`, `needs_review`, `practicing`, `confident` | Self-assessment, not inferred from file counts, time spent or exercise solved count |
| `needsReview` | Boolean, optional `reviewOn` | May be set on any study state; marking Reviewed clears flag only after explicit confirmation, updates lastReviewedAt; does not automatically change mastery to Confident |

Typical actions: `Start learning` (`not_started→in_progress`); `Mark studied` (`in_progress→studied` or direct user-confirmed); `Reopen` (`studied→in_progress`, preserve history); `Needs review` (flag, independent); `Assess mastery` (manual). `Mastery=confident` does **not** assert all related exercises are solved.

### 4.2 Exercise item — solve axis and attempts

| Axis | Values | Rules |
| --- | --- | --- |
| `solveState` | `not_started`, `in_progress`, `blocked`, `solved` | Explicit user status; `blocked` needs obstacle note optionally; `solved` is learner's claim, not verified correctness |
| `needsReview` | Boolean | Can coexist with `solved` (solved but error-prone); `Mark Reviewed` clears flag only, does not imply Solved |
| `attempt.outcome` | `unknown`, `incorrect`, `partial`, `correct` | User self-evaluation of a particular attempt; an incorrect attempt does not erase past solved status without explicit status action |
| `difficulty` / `mistakeTags` | Optional, user-editable | Supports error analysis; does not assert an official grade |

Examples: `not_started→in_progress→blocked→in_progress→solved`. Further attempts are allowed after `solved`; attempts remain distinct. A Solution PDF exists in Materials but **does not** imply the exercise is solved or correct. `Correct` attempt should not silently set `Mastery=confident` for a whole learning unit.

### 4.3 Set and source lifecycle

Exercise sets are Active/Archived; archiving hides from default lists but retains attempts, progress, Tasks and links. A 007 Source becomes Missing/Permission Required/another-device without resetting study statuses. Deleting a learning unit or exercise with dependent history is soft-delete/archive first, with explicit destructive deletion reserved for separate policy.

## 5. Progress definitions and denominators

All progress is **offering-scoped, user-confirmed and evidence-based**. The UI must display numerator **and** denominator; `Unknown / Not configured` if there is no meaningful denominator. Avoid a synthetic single "Course completion %".

### 5.1 Unit study coverage

- Leaf learning units with `includeInCoverage = true` and not archived form set `U`.
- `Studied units = count(u ∈ U where studyState = studied)`.
- `Study coverage = Studied units / |U| × 100%` only when `|U| > 0`; show `6 / 12 tracked units (50%)`.
- Parent sections are outline containers and **must not be double-counted** with child leaf units. For standalone parent with no children, it counts as a leaf.
- `Confident units = count(u ∈ U where masteryState = confident)`; display as separate `Self-rated confident: 4/12` and never conflate with Studied.
- `Needs review = count(flags or needs_review state)`, a workload indicator, not a negative subtraction from study completion.
- If outline coverage is incomplete, show `based on tracked units` and allow manual scope selection. No inference that every PDF equals one unit.

### 5.2 Exercise coverage and completion

- Eligible items `E`: active tracked exercise items not archived with `includeInCoverage = true`.
- `Attempted = count(e ∈ E where at least one explicit attempt exists OR solveState in {in_progress, blocked, solved})`.
- `Solved = count(e ∈ E where solveState = solved)`.
- `Attempt rate = Attempted / |E| × 100%`; `Solved rate = Solved / |E| × 100%`, only for `|E| > 0`.
- `To retry = count(e ∈ E where needsReview true OR solveState = blocked)`; deduplicate union, do not count a blocked-and-flagged item twice.
- `Correct attempts` is an attempt-level historical metric, **not** the same as Solved items.
- No Item definitions yet → show `No exercises tracked`; an imported `Übung 04.pdf` alone does not create a denominator or solved percentage.

### 5.3 Course Overview projections

- 007 Materials Snapshot still counts indexed Resources/files only. 008 Progress Snapshot counts **tracked learning units and exercises** only.
- 007 Overview `Learning Progress` reads the 008 `CourseProgressQuery` if available: studied `x/y`, solved `a/b`, review queue `n`; otherwise shows no-data guide.
- `Study Time` remains canonical Global TimeEntry filtered by offering/owner context, never estimated from sessions or attempts; 0 seconds versus positive under one minute must use shared formatter.
- Stage/Assessment deadlines remain from 007 and Global Calendar. A review target date is not a verified Exam Deadline.
- Recompute derived summaries on canonical state changes; never store a second mutable summary as source of truth. Cache projections may be derived and invalidated on mutation.

## 6. Integration contracts with Module 007 and global services

| Source | 008 consumes | 008 contributes | Guardrails |
| --- | --- | --- | --- |
| `CourseOffering` (007) | `id/courseId/term`, enrollment state | `learningUnitIds` are queried by offering, not copied onto Course | Progress never leaks across semesters |
| `CourseSection` (007) | Optional material category grouping | Optional mapping to Unit via explicit user action | Do not reinterpret "Lectures" virtual category as a taught chapter |
| `CourseMaterialEntry/Source` (007) | Relative path, provenance, device availability, classification hints | Suggestions for a Unit/Set/Item only after review | Re-scan cannot duplicate/erase tracked progress |
| `CourseStudyProgress` (007) | Existing resource studied/reviewed records | Extend to typed targets; persist unit/exercise statuses | One canonical progress source; safe migration and backup |
| `Resource/ResourceLink` (005,007) | PDF/MD/URL identity and capability | Link resource to Unit/Set/Item via canonical relation | No source modification; current-device open checks |
| `GlobalTaskService`, `/tasks` (003,A01-3) | Task list/status, related area and offering | Create Study Task with single Task ID | One Task with multiple associations; no duplicate Task store |
| `GlobalCalendar`, `PlannedSession` (A01-2) | Existing calendar views | Optionally schedule a linked Study Task | Due date/plan/review target/assessment all distinct |
| `GlobalTimer/TimeEntry` (A01-2) | Canonical seconds and offering context | Start timer in existing global session; no direct TimeEntry writes from exercise | Never double count or infer duration from attempts |
| `WorkspaceResumeContext` (A01-2) | Validated route, entity ID, selected inspector | Register last explicit Unit/Exercise context | Resume does not start timer; missing entities safe fallback |
| `InspectorShell` (A01-3) | Desktop panel/tablet drawer/mobile fullscreen, ESC/focus | Domain-specific Unit/Exercise content | No new bespoke modal shell |
| `Note` / external Typora | Existing note/resource identity and availability | Link a note or create Task to take notes | No claim of browser arbitrary app control |
| `CourseAssessment` (007; Exam module 009 later) | Confirmed dates read-only | Optional prepare-for-exam Study Task linking | Cannot fabricate assessment or overwrite official date |

### Interoperation sequences

**A. Material → Exercise tracking:** user opens a 007 exercise PDF → chooses `Track exercises` → reviews suggested set title/numbering → confirms which items exist → 008 creates stable set and item definitions and links the original Resource. No PDF parsing claims or silent auto completion. Opening source checks device capability.

**B. Exercise → Global Task → Timer:** `A2(c)` item → `Create task: Retry A2(c)` → one Study-owned Global Task linked to offering and exercise → optional PlannedSession → start global timer with context → Finish creates one TimeEntry → item status changes **only** when user explicitly marks it.

**C. Unit → Continue Studying:** user opens Unit 1.2 or linked note → record WorkspaceResumeContext referencing stable IDs and route → from Course Overview resume opens correct unit even after reload; no timer auto-start; source missing prompts repair, not data deletion.

**D. Semester reuse:** two CourseOfferings share a Course and may point at the same canonical Resource, but learning units, attempts, progress and tracked items stay separate; `Copy outline to new semester` may copy definitions only with explicit user approval, never copy status or history silently (optional V1 action).

**E. Folder rescan:** 007 source reindexed; missing/renamed PDF changes availability/provenance but linked ExerciseItem/Attempt/Progress remain. User chooses `Locate/Repair` to rebind source through 007.

## 7. Persistence, migrations, validation and errors

- Extend existing IndexedDB Repository/Adapter contracts, typed MutationResult, migration/backup rules accepted under A01-1. No module-level mutable source arrays, ad-hoc localStorage or new backend.
- Uniqueness: `(offeringId,targetType,targetId)` for progress; `(setId,normalizedItemCode)` for active items unless explicitly disambiguated; relationship IDs stable; foreign keys validated at service boundary; no cross-offering foreign references by accident.
- Write unit+linked-progress or exercise+progress safely; where cross-repository writes are non-atomic, surface partial success and provide retry/reconcile instructions; never display false all-or-nothing success.
- Parallel create same exercise item must dedupe inside serialized repository mutation. Concurrent attempt logging must preserve both attempts. Repeated `Mark Solved` is idempotent.
- Existing 007 progress records must migrate without loss. Migration failures keep last committed state and backup; unsupported schema version fails safely.
- Loading/Empty/Error/Offline/Permission Required/Archived/Deleted dependencies must be explicit. A resource on another device can still be listed and studied states can be managed without pretending bytes are accessible.
- Data deletion is non-destructive by default; exercise history and all cross-links survive source detach; destructive erase is out-of-scope without an explicit data-retention design.

## 8. Page-level interaction details

### 8.1 Unit inspector
- Name/code, hierarchy breadcrumb, studyState, self-rated masteryState, review flag/due-on, update time, linked Resource/Note/Task, recent TimeEntry (read-only), evidence/actions timeline.
- Actions: Edit unit, Mark in progress/studied, Assess confidence, Flag/clear review, Link existing resource/note, Create Study Task, Schedule linked task, Start Timer, Continue Work. Never make PDF open automatically increment mastery.

### 8.2 Exercise inspector
- Set/title/itemCode, linked learning unit, solution/source availability (separately), solveState, review flag, last attempted, attempts list with outcome/mistake tags, notes and linked tasks.
- Actions: Log attempt, Mark solved/blocked/in progress, Flag for review, Mark reviewed, Create retry task, Open source, Link note. Allow `undo/restore` with explicit confirmation where data entry error occurred.

### 8.3 Error and empty messages
- No units: `Add learning units to track what you've studied.`
- No exercise items: `Importing Übung PDFs does not automatically mark exercises tracked. Add or confirm questions.`
- Source unavailable: `Indexed material is available as metadata; file can't be opened on this device.`
- Persistence failure: `Could not save. Your previous saved state is unchanged.` if proven; use truthful partial-failure text otherwise.
- Review queue empty: `No exercises flagged for review.`
- No configured denominator: show `Progress not configured`, not `0% complete`.

## 9. 30-point acceptance matrix

1. Route `/progress` loads correct CourseOffering; no cross-semester data bleed.
2. Route `/exercises` loads correct CourseOffering; unimplemented tabs remain clearly future.
3. Learning outline allows create/rename/reorder/nest/archive with stable IDs and no cycles.
4. Parent and leaf unit counts do not double count coverage.
5. Empty outline shows Unknown/Not configured, not fictitious 0% course completion.
6. Imported lecture/material files do not auto-generate studied units.
7. Link existing 007 Resource to learning unit without copying bytes/Resource ID.
8. Resource missing/permission denied does not delete unit/exercise history.
9. Study state and mastery state are independent.
10. Review flag is independent of Studied/Confident states.
11. Opening Resource or logging time never marks unit studied/learned.
12. Exercise Set can link original 007 Übung/KGÜ Resource.
13. Exercise items have stable scoped identity; distinct `A2(a)` and `A2(c)`.
14. Same set/item concurrent creation cannot produce duplicate active canonical item.
15. Attempt records remain after item state changes and reattempts.
16. `Incorrect` attempt does not automatically change unit mastery or official grade.
17. Explicit Solved/Blocked/In progress statuses work and are persisted.
18. Solved and needs-review can coexist, and review queue does not double count.
19. Attempt and solved ratios use tracked active items as denominator only.
20. Missing denominator always shows Not configured rather than misleading percent.
21. Course Overview 007 reads canonical summary from 008 after implementation.
22. `Mark Studied` on an individual 007 Resource does not auto-finish an entire Unit.
23. Creating a study/retry task yields one canonical Global Task and cross-view synchronization.
24. PlannedSession changes do not affect Task Due Date or Assessment Deadline.
25. Global Timer Finish saves actual TimeEntry only once and does not set exercise status.
26. Continue Studying deep-links to Unit/Exercise and does not start Timer automatically.
27. Refresh retains units, exercises, attempts, progress and review flags via accepted persistence layer.
28. Existing 007 resource-level progress survives schema migration and source re-scan.
29. At 1440/1024/390 widths all core actions work without horizontal overflow; shared InspectorShell ESC/focus.
30. Existing modules 001–007 and global services still pass relevant tests; Typecheck/Lint/Build/Tests and QA report actual results.

## 10. Suggested GitHub OSS references (research snapshot 2026-11-21)

Scope-specific candidates researched before any coding; stars are approximate observations and require revalidation before source reuse. Deployment difficulty is relative to embedding into the existing React/TS/IndexedDB app, **not** a tested installation.

| Candidate / Source | Stars | Last verified commit | License | Stack / Deployment Difficulty | Reuse / adaptation and risks |
| --- | ---: | --- | --- | --- | --- |
| [Saxermi/study_tracker](https://github.com/Saxermi/study_tracker) | 0 (search snapshot) | 2026-11-20 | MIT (LICENSE checked) | Python 3.10+ + vanilla JS; **Medium** to adapt (different backend) | Strong exercise self-evaluation, course/task hierarchy and study-session interaction reference. Rebuild domain views in React/TS rather than importing Python server. Tiny community and limited validation. |
| [JStanoeva/course-tracker](https://github.com/JStanoeva/course-tracker) | 1 (search snapshot) | 2025-09-20 | MIT (LICENSE checked) | React + TS + Vite + Supabase; **Medium** (backend differs) | Course lesson/exercise completion UI/reference; adapt components selectively, not Supabase records. Stale commit/very small community and data model may mismatch canonical Repository. |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | ~877 (Nov 2026 snapshot) | 2026-11-19 | MIT (LICENSE checked) | TypeScript package (with separate Rust binding monorepo); **Low–Medium** for core npm package | Potential **future** opt-in review scheduler if user later approves; not required or installed for 008 V1.0. Risk: scheduler versions/Node requirements and incorrect application to non-flashcard exercises; do not infer mastery or reschedule tasks automatically. |

**Recommendation:** implement first-party canonical StudyUnit / Exercise / Progress logic against existing app contracts; borrow information layout and data concepts from Saxermi/JStanoeva after license check. Do **not** integrate FSRS until a later explicit review-scheduling design decision. Avoid whole-project forks or incompatible backend frameworks.

## 11. QA handoff and sequencing

1. **Approval recorded (2026-11-21):** Design window received user confirmation, froze the V1.0 design as `DESIGN_APPROVED.md` and authorized publication of `EXECUTION_INSTRUCTION.md` under `docs/handoffs/008/`, with `DESIGN: APPROVED; IMPLEMENTATION: NOT STARTED; QA: PENDING`.
2. Before 008 development, **007 must receive independent QA ACCEPTED** and the accepted implementation commit must be recorded. 008 execution instruction must reflect actual 007 Types/Repositories. If 007 architecture differs materially, report an interface conflict to design window; do not silently rewrite the approved design.
3. Development window implements 008 on a separate branch; preserves modules 001–007; submits PR, implementation summary, migration and 30-point acceptance self-check.
4. QA window independently runs tests and browser flows, reports ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE with evidence; Review Only (no code modification).
5. Design window accepts/requests corrections, then may authorize Module 009.

**Current approval boundary (2026-11-21):** DESIGN APPROVED / FROZEN. GitHub publication of the handoff is authorized. Implementation is NOT authorized before Module 007 receives independent QA ACCEPTED and an accepted implementation commit is recorded and reviewed. QA ACCEPTED cannot be claimed before Module 008's own independent review.