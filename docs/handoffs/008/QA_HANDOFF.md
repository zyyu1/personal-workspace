# Module 008 — Independent QA Handoff

## Candidate

- Branch: `codex/module-008`
- Accepted Module 007 / start baseline: `5e2849ec4e4ba0147ab8ab5051d442717171ec19`
- Implementation commit: `f5c5b003fe979eb5d253f075f660c771ee2c928a`
- Pull request: https://github.com/zyyu1/personal-workspace/pull/18
- QA mode: **Review Only**. Do not modify this branch or merge the PR.

## Scope implemented

- Added `/study/courses/:courseOfferingId/progress` and `/study/courses/:courseOfferingId/exercises` through the existing lazy-loaded `CourseWorkspace` route.
- Extended the one canonical `study-courses` repository from schema v1 to v2 with `CourseLearningUnit`, `CourseExerciseSet`, `CourseExerciseItem`, `CourseExerciseAttempt`, typed progress targets, and evidence links.
- Implemented safe v1 migration with repository backup, stable legacy IDs, legacy resource progress, manual material classifications, notes, source/section fields, and existing seed data preserved.
- Added offering-scoped outline CRUD, ordering, nesting and cycle prevention; independent study/mastery/review axes; active-leaf denominators.
- Added set/item tracking, stable normalized item identity, serialized concurrent deduplication, explicit solve/review state, append-only attempts, optional revision metadata, filters and review queue.
- Reused canonical Resource/ResourceLink, GlobalTask, TimeEntry, WorkspaceResume, AppShell, Course Header/Tabs and InspectorShell. No second Task, Resource, Timer, TimeEntry, Course or progress store was added.
- Updated Module 007 Overview to read `CourseProgressQuery`; resource file opens and resource-level marks remain independent.
- Added responsive warm-beige UI and shared Inspector focus target support.
- Recorded the OSS license/activity assessment in `OSS_REUSE_REVIEW.md`; no third-party source or dependency was added.

## Migration and identity checks

- Stored envelope moves from `schemaVersion: 1` to `2` through `migrateStudyState`; unsupported versions fail through the accepted repository migration contract.
- Existing `CourseStudyProgress.id`, `offeringId`, `resourceId`, `sectionId`, `state`, `updatedAt`, and `noteId` survive. New typed target identity is derived without replacing the old identity.
- New entities use the existing `stableId` generator. Progress uniqueness is `(offeringId,targetType,targetId)` and item uniqueness is active `(setId,normalizedCode)` inside a serialized mutation.
- All new definitions, attempts and progress remain `CourseOffering` scoped. A shared Resource does not share semester progress.

## Commands and actual results

| Command | Result |
|---|---|
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0; 12 pre-existing warnings in Research files, 0 new errors/warnings |
| `npm test` | PASS, 11 files / 156 tests |
| `npm run build` | PASS, exit 0; `CourseWorkspace` 173.21 kB / gzip 70.39 kB |
| `git diff --check` | PASS |

New Module 008 suite: 19 tests covering schema migration/backup, stable IDs, semester isolation, persistence invalidation, cycles, leaf denominators, independent axes, archive retention, concurrent item creation and attempts, canonical resources/tasks, unavailable resources, rescan preservation, Resume fallback, and UI Inspector behavior.

Browser verification used the actual Vite application and browser viewport overrides. The measured page `innerWidth` was 1440, 1024 and 390 respectively; `documentElement.scrollWidth > clientWidth` was false at all three widths. The 390px exercise Inspector filled the viewport, and Escape closed it. The first tablet pass exposed a toolbar overflow; it was fixed and rechecked. Interactive screenshots were observed during QA but no misleading headless loading-state image was committed.

## 30-point developer self-check

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Offering-filtered repository query and cross-semester regression test. |
| 2 | PASS | Exercises route works; Exams/Labs/Notes remain disabled Future tabs. |
| 3 | PASS | Create/edit/reorder/nest/archive services and UI; stable IDs and cycle test. |
| 4 | PASS | Parent IDs excluded from eligible leaf denominator; regression test. |
| 5 | PASS | Undefined percentage and no-unit empty state; no fabricated completion. |
| 6 | PASS | Materials import never creates units/progress; canonical stores stay separate. |
| 7 | PASS | Existing Resource ID linked via ResourceLink; bytes/availability unchanged in test. |
| 8 | PASS | Resource unlink/unavailability test retains unit and progress history. |
| 9 | PASS | Separate `studyState` and `masteryState`, independently tested and edited. |
| 10 | PASS | Review flag/date independent and explicit review-clear behavior tested. |
| 11 | PASS | Resource mark and TimeEntry test leaves Unit progress absent. |
| 12 | PASS | Set/Item source ResourceLinks and original Resource identity tested. |
| 13 | PASS | `A2(a)` and `A2(c)` remain different stable items. |
| 14 | PASS | Concurrent normalized duplicate create returns one active item. |
| 15 | PASS | Concurrent attempts survive solve-state changes; append-only by default. |
| 16 | PASS | Attempt outcome is historical only; does not alter mastery/grade. |
| 17 | PASS | Explicit solve selector persists not-started/in-progress/blocked/solved. |
| 18 | PASS | Solved + review coexist; derived retry count is a deduplicated union. |
| 19 | PASS | Rates include active, non-archived, opted-in items only. |
| 20 | PASS | Empty denominator returns no percentage and UI says no tracked items. |
| 21 | PASS | Overview calls `StudyLearningService.queryProgress`; no mutable summary. |
| 22 | PASS | Resource-level Mark Studied does not create Unit progress; regression test. |
| 23 | PASS | One Global Task ID per target; GlobalTaskService cross-view test. |
| 24 | PASS | Existing canonical Planning/Calendar tests verify planned sessions do not alter due/assessment dates; Module 008 creates the Task then routes to its shared inspector. |
| 25 | PASS | Existing canonical Timer/TimeEntry idempotency tests pass; Module 008 only invokes shared timer controls and never changes solve state. |
| 26 | PASS | Unit/Item Resume entities validate stable IDs, deep-link, safely fall back, and never start Timer. |
| 27 | PASS | Repository invalidation persistence test retains units/sets/items/attempts/progress. |
| 28 | PASS | v1 migration plus source-rescan test preserves resource-level reviewed progress. |
| 29 | PASS | Browser 1440/1024/390 no page overflow; mobile fullscreen Inspector; Escape/focus automated test. |
| 30 | PASS | Full 001–007 regression, typecheck, lint, build, tests and diff check reported above. |

## Known limitations / review focus

- Persistence remains device-local IndexedDB; no cloud/multi-device synchronization or cross-tab cache invalidation.
- Resource/Task relation writes span repositories and cannot be globally atomic. The service validates first and surfaces truthful reconciliation errors on partial writes.
- There is no accepted canonical Note service yet, so Module 008 does not invent a second Note database; note IDs already present in migrated records remain preserved.
- Scheduling is performed through the canonical Task Inspector after creating/opening the Study task. Module 008 does not add a calendar store or automatic scheduler.
- Source opening remains capability-gated by `GlobalResourceService`; indexed metadata never implies current-device byte access.
- Copying an outline between offerings is optional in V1 and intentionally not implemented; no status/history is silently shared.

## Independent QA request

Please independently inspect migration failure safety, cross-offering isolation, concurrent duplicate item creation, concurrent attempt retention, resource availability/history behavior, Task/Timer/Resume integration, and browser behavior at 1440/1024/390. Re-run the commands above. Return exactly one decision with evidence:

`ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE`

Do not modify code, merge the PR, start Module 009/010, or resume B2B/B3.
