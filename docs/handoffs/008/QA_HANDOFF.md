# Module 008 — Independent QA Handoff

## Candidate

- Branch: `codex/module-008`
- Accepted Module 007 / start baseline: `5e2849ec4e4ba0147ab8ab5051d442717171ec19`
- Implementation commit: `f5c5b003fe979eb5d253f075f660c771ee2c928a`
- Initial rejected candidate HEAD: `e31502bb346b38c0a559519f97b829da22c963ae`
- Initial independent QA: **REJECTED**, 26 PASS / 1 PARTIAL / 3 FAIL ([evidence](https://github.com/zyyu1/personal-workspace/pull/18#issuecomment-7069366299))
- Revision 01 implementation commit: `f61fed69b352a93c3f4325ed50381bd363cbb863`
- Exact final PR HEAD: recorded in the new Review Only request comment after the documentation commit; that GitHub SHA is the sole review anchor.
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

## Remediation Revision 01

- **M008-QA-001:** patch operations now distinguish omitted fields from explicitly empty optional text. Unit code/description, Set code, Item title/source pointer, and Attempt notes survive unrelated updates and repository invalidation; explicit empty values still clear those optional fields.
- **M008-QA-002:** Study targets use a deterministic canonical Task identity through serialized `GlobalTaskService.ensure`. Concurrent/repeated calls return one Task and one evidence link. If the Study relation write fails after the Task commits, the error reports that partial state and retry reconciles the same Task ID.
- **M008-QA-003:** the Course Overview card renders studied Units, solved Exercises, and Review Queue from one `CourseProgressQuery`, with independent `Not configured` states for missing denominators.
- **M008-QA-004:** create-and-auto-open Unit and Exercise flows pass stable, enabled form-input focus targets into the existing `InspectorShell`; Escape restores focus. Existing-row focus restoration remains intact.
- **M008-QA-005:** this handoff preserves the initial implementation and rejected candidate history. The final GitHub PR HEAD is published after all commits rather than embedded as a self-invalidating SHA.

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
| `npm test -- --run` | PASS, 11 files / 160 tests |
| `npm run build` | PASS, exit 0; `CourseWorkspace` 173.85 kB / gzip 70.51 kB |
| `git diff --check` | PASS |

Module 008 suite: 23 tests. Revision 01 adds deterministic omitted/explicit-clear metadata persistence, `Promise.all` Task idempotency, injected partial-failure recovery, no-Unit Overview exercise/review projection, and create-to-Inspector Escape focus regressions for Units and Exercise Items.

Browser verification used the actual Vite application and browser viewport overrides. At 1440×900, 1024×768 and 390×844, `documentElement.scrollWidth > innerWidth` was false. Create Unit → Inspector → Escape restored `New learning unit`; Create Item → Inspector → Escape restored `Exercise item code`; an existing Unit row regained focus after Escape. At 390px the Inspector bounding box was exactly 390×844. The Overview rendered `Learning units 0/2 studied`, `Exercises 1/2 solved`, and `Review queue 1` from persisted browser data. The temporary Vite server was stopped after verification.

## 30-point developer self-check

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Offering-filtered repository query and cross-semester regression test. |
| 2 | PASS | Exercises route works; Exams/Labs/Notes remain disabled Future tabs. |
| 3 | PASS | Partial patches preserve omitted Unit/Set/Item/Attempt metadata across invalidation; explicit clears and stable IDs are tested. |
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
| 21 | PASS | Overview renders Unit x/y, Exercise a/b and Review n from one query; missing denominators show `Not configured`. |
| 22 | PASS | Resource-level Mark Studied does not create Unit progress; regression test. |
| 23 | PASS | Serialized deterministic Task ensure; concurrent/repeat and injected relation-failure recovery tests prove one Task ID/link. |
| 24 | PASS | Existing canonical Planning/Calendar tests verify planned sessions do not alter due/assessment dates; Module 008 creates the Task then routes to its shared inspector. |
| 25 | PASS | Existing canonical Timer/TimeEntry idempotency tests pass; Module 008 only invokes shared timer controls and never changes solve state. |
| 26 | PASS | Unit/Item Resume entities validate stable IDs, deep-link, safely fall back, and never start Timer. |
| 27 | PASS | Repository invalidation persistence test retains units/sets/items/attempts/progress. |
| 28 | PASS | v1 migration plus source-rescan test preserves resource-level reviewed progress. |
| 29 | PASS | Browser 1440/1024/390 no overflow; 390×844 fullscreen Inspector; Unit/Item auto-open Escape and existing-row focus tested. |
| 30 | PASS | Full 001–007 regression, typecheck, lint, build, tests and diff check reported above. |

## Known limitations / review focus

- Persistence remains device-local IndexedDB; no cloud/multi-device synchronization or cross-tab cache invalidation.
- Resource/Task relation writes span repositories and cannot be globally atomic. Task creation is deterministic and serialized; a failed Study relation write reports the committed Task ID and a retry reconciles it without duplication.
- There is no accepted canonical Note service yet, so Module 008 does not invent a second Note database; note IDs already present in migrated records remain preserved.
- Scheduling is performed through the canonical Task Inspector after creating/opening the Study task. Module 008 does not add a calendar store or automatic scheduler.
- Source opening remains capability-gated by `GlobalResourceService`; indexed metadata never implies current-device byte access.
- Copying an outline between offerings is optional in V1 and intentionally not implemented; no status/history is silently shared.

## Independent QA request

Please review the exact PR HEAD published in the new GitHub request. Reproduce M008-QA-001 through M008-QA-005, then inspect the complete frozen 30-row matrix, migration safety, cross-offering isolation, resource availability/history, Task/Calendar/Timer/Resume integration, and browser behavior at 1440/1024/390. Re-run the commands above. Return exactly one decision with evidence:

`ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE`

Do not modify code, merge the PR, start Module 009/010, or resume B2B/B3.
