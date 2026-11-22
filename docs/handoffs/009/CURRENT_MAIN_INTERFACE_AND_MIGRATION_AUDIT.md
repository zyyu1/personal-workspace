# Module 009 — Current-main Interface & Schema Migration Audit (pre-implementation)

**Audit state:** COMPLETE / NO MATERIAL DESIGN CONFLICT FOUND / FIXED IMPLEMENTATION GUARDS REQUIRED.  
**Reviewed code baseline:** `main` at **`1a77022f0b1af013e137ec01cd3942e7028e3c0b`** before 009 documentation-only preparation commits. Module 008 accepted merge code baseline: `48558a862b299b030fbd680aa9677115c92ca773`.  
**Date:** 2026-11-22 (Europe/Berlin). **Not a code QA report or a claim that future migration works.**  
**Frozen product design:** [DESIGN_APPROVED.md](./DESIGN_APPROVED.md). **OSS evaluation:** [OSS_REUSE_REVIEW.md](./OSS_REUSE_REVIEW.md).  
**Rule:** Developer must repeat the actual latest-`main` contract check before coding. If new main changes those contracts or creates a material incompatibility, STOP for Design Window; the audit baseline is not automatically current forever.

## 1. Inspected actual source contracts, gaps and authorized strategies

| Source / canonical owner | Actual code at accepted baseline | Module 009 authorized adaptation and guard |
| --- | --- | --- |
| `src/features/study/types.ts` | `Course`, `CourseOffering` separate; `CourseAssessment` is `{id,offeringId,assessmentType,title,officialDateTime?,originalTimezone?,provenance?,registrationStatus?,verified}`; `StudyState.assessments` canonical | **Extend, never replace IDs/meaning**; add `ExamMilestone`, `ExamSitting`, `CoursePastPaper`, offering links and `PastPaperPractice` as explicitly typed arrays in the **same** StudyState; scope all personal result/practice to correct offering. Do not create a new authoritative Exam DB. |
| `src/features/study/services/studyCourseService.ts` | `StudyRepository=createVersionedRepository({domain:'study-courses',schemaVersion:2,seedVersion:1,migrate:migrateStudyState})`; **migrateStudyState accepts only `fromVersion===1`**. `saveAssessment` performs whole-object replacement by ID with only title/Date.parse validation; `listVerifiedAssessments` returns verified records with known officialDateTime | Change to schema **v3** with **both `1→3` and `2→3` paths** and pre-migration backup. Preserve v1→v2 normalization semantics, all old fields and IDs. New Assessment update must enforce ownership/validated state/date, prevent same-ID overwrite from a different offering, and support explicit `verified` changes; no date-only `new Date` normalization. |
| `src/data/persistence/repository.ts`, `contracts.ts`, `adapters.ts` | Repository stores one domain envelope, serialized `mutate`, `backup` before schema transition, one final write and `invalidate`; IndexedDB storage `records` / `migration-backups`; unsupported schema/seed versions fail safely | Reuse exact domain `study-courses`, bump only its **schemaVersion 2→3**. `migrate(data,fromVersion)` can dispatch `1→2→3` logically in-memory and `2→3` directly, **without writing an intermediate v2 envelope**. Ensure error leaves previous committed data and backup. Test migration read/backup/write failure injection, old IDs, legacy manual classifications, resources/progress/Tasks/008 exercises/special code. Do not bump global IndexedDB database version or rewrite unrelated repository domains. |
| `src/features/study/services/studyLearningService.ts` | Existing serialized 008 Unit/Set/Item/Attempt; `createTask` calls `GlobalTaskService.ensure` with deterministic `task-study:<offering>:<target>:<id>`, then stores an idempotent `StudyEvidenceLink` with recovery on relation failure | Reuse existing 008 ExerciseSet/Item/Attempt for optional per-question Past Paper work. New exam-related tasks should follow deterministic `GlobalTaskService.ensure` + stable relation IDs, preserve failure/retry recovery; do not change 008 history or count paper import as practice. `StudyEvidenceLink.targetType` currently limits 008 entity types, so either extend a scoped typed relation or define a well-validated 009 relation array *within StudyState*; no second Task source. |
| `src/services/globalResourceService.ts` | One canonical `resources` repository, `GlobalResourceService.get`, `linkResource`, `openOriginal`, explicit `ByteAvailability`, current `ResourceEntityType` does not include `course-past-paper` (it has `paper`, which already means Research literature paper) | Do **not** reuse Research `paper` entity type for Course Past Paper. If resource-to-paper relation is required, add **one explicit discriminant** e.g. `course-past-paper` and verify Idempotent linking. `questionResourceId` and optional `solutionResourceId` must refer to actual Global Resources; use existing permission/openOriginal checks. Unavailable bytes never destroy paper metadata/history. |
| `src/features/study/services/studyCourseService.ts` `getOffering` and Materials | Course resource list is filtered by ResourceLink `entityType='course-offering'` and matching `offeringId`; known classification `past-papers`, imported `Altklausur` is just a Resource metadata classification | Course-wide past paper metadata is **not** automatically a course-offering Resource or an Assessment. Require explicit offering membership, link IDs and correct resource presentation; if a Resource should also appear in that offering's shared Materials/Resource UI, use its existing course-offering link convention. Never copy PDF bytes or create Assessment from filename. |
| `src/services/globalCalendarService.ts` | `CalendarItem.sourceType` includes `assessment-deadline`; project/offering scope via `query({projectId})` (default Research), one `listVerifiedAssessments` projection with `date=officialDateTime.slice(0,10)`, `start=end=officialDateTime`, `precision='exact'`, route to **Overview**. Does **not** represent date-only vs exact, distinct registration milestones or user-confirmed vs source-verified | Extend **shared derived query** with one canonical exam event and separately identified registration/withdrawal milestones; preserve old 007 assessment-date visibility/identity, avoid double old + new projection, use explicit `date-only` with **no start/end**, validated original local time/timezone for exact, correct `/exams` deep link; cancelled/superseded excluded from current. Retain existing Research calendar items. **Do not** silently implement all-project aggregate Calendar; 009 only requires correct offering-scoped shared Calendar behavior. |
| `src/components/GlobalCalendarPage.tsx` | Project selector shows Research and Study offerings, source filter options are fixed; agenda displays exact time via `new Date(start).toLocaleTimeString()`, other source types might not display precision/timezone metadata | Add new exam/registration milestone source-type options or reuse compatible categories without hiding items. Label original zone vs device-local time clearly. For exact events, render the correct source-local time/zone or a clearly labeled converted device time; **never** silently infer an exam hour or timezone. Verify month-boundary/DST browser cases. |
| `src/services/globalTaskService.ts` | Canonical Task list/get/create/update/planDay/addSession, deterministic `ensure(id,values)` verifies `projectId` and `area`; Calendar reads the same Task due date | Use `ensure`, not blind create; scope IDs by offering/assessment/milestone. Preserve Task dueDate independent from verified exam date, registration end, PlannedSession and practice. Add `Promise.all`, failure-injection and retry idempotency tests. |
| `src/services/workspaceResumeService.ts` | `ResumeEntityType` includes 008 `learning-unit` / `exercise-item`; `resolveLatest` validates these via `StudyLearningService.entityExists`. Research `paper` already identifies a literature paper. New exam entities are **not** validated and would fall through to false | Add separate `assessment` / `course-past-paper` / `exam-practice` entity types (names may differ but do not reuse Research `paper`); stable validated deep link and safe fallback after archive. Do not auto-start timer. |
| `src/App.tsx`, `src/features/study/components/StudyTabs.tsx`, `CourseWorkspace.tsx`, `InspectorShell.tsx` | App maps only `materials/progress/exercises` to active course sections, else routes to Overview. Exams tab is Future/disabled; Inspector is shared and supports `returnFocusTo` for 008 create/ESC | Add functional `/study/courses/:courseOfferingId/exams` route/section; leave Labs/Notes clearly Future. Reuse shell and keyboard focus restore for create→autoopen→Escape at 390/1024/1440. Keep 007 Overview and 008 Exercises/Progress untouched except authorized read-only projections. |
| `src/services/timeEntryService.ts`, global Timer | TimeEntry is a canonical separate `time-entries` domain with `timerSessionId` idempotency. No exam-practice actual timer model exists | A paper's manually self-reported practice duration is **not an actual TimeEntry**. Only shared Timer controls create real actuals. No automatic Timer start/stop or derived solve state. |

## 2. Migration contract — from v1 or v2 to Study schema v3

**Source-of-truth mapping:** `StudyState` is the only canonical Study data store. `CourseAssessment` remains the real assessment owner, and old `verified`/date fields retain history. Extension adds separate subordinate records; nothing in 007/008 is moved into a parallel store.

**Proposed migration dispatch (pseudocode, not code implementation):**

```ts
function migrateStudyStateToV3(stored: unknown, fromVersion: number): StudyStateV3 {
  if (fromVersion !== 1 && fromVersion !== 2) throw validationFailure('Unsupported schema');
  // Preserve prior exact v1 -> v2 normalization for resource progress and metadata.
  const v2 = fromVersion === 1 ? migrateV1ToV2(stored) : validateAndCopyV2(stored);
  // The 009 extension must not reinterpret a PastPaper classification as an Exam.
  return extendV2ToV3(v2, {
    examMilestones: [],
    examSittings: [],
    coursePastPapers: [],
    pastPaperOfferingLinks: [],
    pastPaperPractices: []
  });
}
```

- **v1 → v3:** preserve `CourseStudyProgress.id`, `offeringId`, legacy `resourceId`/`sectionId`, `state`, `noteId`, manual materials classification, original path/source IDs and source rescan history, as proven by existing 007/008 regressions. Preserve all legacy `CourseAssessment` values.
- **v2 → v3:** preserve all 008 learning Units, ExerciseSets/Items/Attempts, progress and evidence links exactly. Add empty 009 arrays, not mock 'completed' paper/session values.
- **Legacy verified Assessment:** preserve original `officialDateTime`, `originalTimezone`, `verified`, `provenance` and Calendar eligibility. If compatibility milestone is backfilled, mark `legacy-verified` only (not `source-verified`) and use a deterministic ID; its Calendar projection must **replace**, not duplicate, the legacy event. If a v2 `verified=true` record lacks a date it remains unplaced.
- **Partial writes:** repository backups run before schema version upgrade. On unsupported version, malformed data, injected backup/read/write failure, or invalid reference: show a truthful non-destructive migration error; no partial v3 record, no lost v2 data. Retry safely.
- **Cross-domain relations:** post-migration Resource/Task references are still only IDs; migration must not mutate Global Resources/Tasks/TimeEntries as a side effect. If a later user action spans repositories, use idempotent `ensure` + retry to reconcile partial commits.
- **Validation:** scoped foreign keys, stable IDs, duplicate logical entities, archive status, date precision, evidence status and tags should be validated in mutation APIs, not only UI.
- **Date-only:** store a literal civil date string `YYYY-MM-DD`, not an invented `00:00:00Z` instant. Exact date/time requires an IANA zone for reliable instant conversion; unknown zone is explicitly disclosed. DST gaps and ambiguous folds must be rejected or require explicit user selection; no silent coercion. Use the frozen D2 model, not ad-hoc native Date.parse behavior.

## 3. Pre-start integration risk disposition

**No material contradiction** found between the frozen Module 009 scope and the source at `1a77022`, but none of these gaps were already implemented. The following are **mandatory implementation work**, not claims of PASS:
1. Schema `1→3` and `2→3` + backup preservation.
2. Precise verified vs tentative and date-only vs exact Calendar projection, no duplicate legacy exam.
3. Typed Resource links for course Past Paper without conflating scholarly `paper`.
4. Extend Resume entity validation and safe deep links.
5. Task idempotency and cross-store partial-failure reconciliation.
6. Offering-scoped PastPaper membership, ExamSitting and practice isolation.
7. No unofficial inference: Paper PDF import ≠ Assessment, solved question, mastery, sitting or official result.
8. UI route plus shared Inspector + 3 responsive breakpoints.
9. Preserve 007 and 008 regressions including Windows folder-picker capability contract (no invented new local-host access).
10. One timezone library at most with exact license/version/bundle gate from `OSS_REUSE_REVIEW.md`.

**STOP thresholds:** an upstream API change invalidating this audit, a requirement to rewrite a frozen global Calendar system, loss of legacy Study data, unvalidated DST conversion, a second canonical Task/Resource/Exercise store, or a new dependency outside reviewed options requires return to Design Window before code proceeds.

**Audit conclusion:** **INTERFACE COMPATIBILITY CONDITIONAL PASS** for issuing a narrowly scoped Module 009 development authorization. **Actual migration/runtime PASS must still be proven by Development + independent Review Only QA**, not assumed from design inspection.
