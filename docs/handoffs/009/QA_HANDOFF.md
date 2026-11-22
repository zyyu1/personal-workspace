# Module 009 — Independent QA Handoff (Exams & Past Papers V1.0)

## Candidate

- Repository: `zyyu1/personal-workspace`
- Branch: `codex/module-009` (repository historical naming; executor is the Claude Code cloud Development / Execution Window)
- PR: https://github.com/zyyu1/personal-workspace/pull/20 → `main`
- Work order: [Issue #19](https://github.com/zyyu1/personal-workspace/issues/19)
- Branch base (latest `main` at start): `b6140bd` (contains 007 merge `cd2c7145…` and 008 merge `48558a86…`; source unchanged since audit baseline `1a77022`)
- Implementation commit: `f53fa04994ae85450f0a46bf5f8569b42ab732a0`; tests `ecae008ecc8d96f7fdfb62c18167ddd60337d41f`
- **Exact final PR HEAD:** published in the PR #20 Review Only request comment after this documentation commit. That GitHub SHA is the sole review anchor (no self-invalidating in-tree SHA).
- QA mode: **Review Only**. Do not modify the branch or merge the PR. Merge is **not authorized**.

## Execution environment (truthful)

- Development: Anthropic-hosted Claude Code cloud workspace. **No access** to the user's Windows PC, folders, native file picker or local app data.
- The cloud workspace cannot reach the npm registry, so `npm` commands were **not** run locally. All five mandatory commands and the browser smoke ran on the scoped GitHub Actions workflow (`MODULE_009_CI_PERMISSION_APPROVAL.md`) against the exact PR head.
- Browser evidence = GitHub-hosted `ubuntu-latest`, headless Google Chrome 157, `vite preview` of the built app. **Not** Windows host / native folder-picker validation.

## CI configuration (scoped approval evidence)

- File: `.github/workflows/module-009-ci.yml` (first commit `d131025`).
- Trigger: `pull_request` with base `main`; job guard `github.repository == 'zyyu1/personal-workspace' && github.head_ref == 'codex/module-009' && head repo == repository`.
- Token: `permissions: contents: read`; `persist-credentials: false`; no secrets; no `pull_request_target`, `workflow_run`, schedule, deploy, artifacts or auto-merge.
- Actions pinned to commit SHAs: `actions/checkout@3d3c42e…` (v7.0.1), `actions/setup-node@949feb2…` (v7.1.0).
- **Node 24** (not 22): baseline `main` code run on Node 22 failed 3 pre-existing ZIP manifest tests (`ZIP preflight failed: File format is not recognized`, jsdom File/Blob interop); identical code on Node 24 passed 160/160. Diagnosed in run [45045970624](https://github.com/zyyu1/personal-workspace/actions/runs/45045970624) (matrix 22/24). No application code was changed for this.
- Browser smoke step: `tools/ci/module-009-browser-smoke.mjs` (Node built-ins only, Chrome DevTools protocol). Added under the "check the existing application" scope; no new dependency or permission. Flag for Design Window if this is considered outside the approved CI scope.

## Command evidence (CI, exact head `ed1c4095c0b9b6990da02d6fc0164decb7b03307`, run [45047487262](https://github.com/zyyu1/personal-workspace/actions/runs/45047487262))

| Command | Result |
|---|---|
| `npm ci` | PASS (committed lockfile, unchanged) |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 — **0 errors, 12 warnings**, all 12 pre-existing in `src/features/research/**`; no new warnings |
| `npm run build` | PASS, exit 0 |
| `npm test -- --run` | PASS — **12 files, 186/186 tests** (baseline 160 + 26 new in `StudyExams.test.tsx`) |
| `git diff --check origin/main...HEAD` | PASS, exit 0 |
| Browser smoke | PASS — 17 evidence checks, 0 failures |

The final docs-only head re-runs the same workflow; its run link is posted with the exact HEAD in the PR comment.

## Dependency decision

- **No dependency added; `package.json` / `package-lock.json` unchanged.** The OSS review permits *at most one* timezone library "if needed". The platform `Intl` time-zone database (Node 24 full ICU, all evergreen browsers) gives strict IANA validation, DST gap rejection and fold detection in `examDates.ts`, so `@js-temporal/polyfill` was not installed. Bundle/licence delta: none.

## Scope implemented

- **Schema v3** on the single `study-courses` repository: explicit `fromVersion===1` (exact 007/008 v1→v2 normalization reused) and `fromVersion===2` (validated copy) paths; adds empty `examMilestones`, `examSittings`, `coursePastPapers`, `pastPaperOfferingLinks`, `pastPaperPractices`. Repository backup-before-migrate and single final write reused; `seedVersion` and IndexedDB DB version unchanged. No mock exam data seeded.
- **Dates (`examDates.ts`)**: `unknown` / `date-only` (`YYYY-MM-DD`, no time) / `exact` (local date + `HH:mm` + required IANA zone → derived UTC instant). Strict parsing (no `Date.parse` validation), real-day check, DST gap rejected, fold requires explicit `earlier`/`later`.
- **`StudyExamService`**: assessment create/update/archive/cancel/restore (legacy 007 fields untouched; new optional `lifecycle`, `registration`, timestamps); manual registration status with append-only history; milestones (`registration-open/close`, `withdrawal-close`, `exam`, `grade-release`) — a new date **supersedes** (never overwrites) the previous active one of the same kind; `legacy-verified` reserved, `source-verified` requires evidence, unknown dates cannot be confirmed; explicit sittings with participation/outcome/grade source, no pass/fail inference; course-wide past papers referencing existing Resources (`course-past-paper` ResourceLink, no bytes copied) with explicit, idempotent offering links; offering-scoped self-reported practice; optional idempotent mapping to one deterministic 008 `ExerciseSet` per paper+offering (no items/attempts/progress created); canonical exam Tasks via `GlobalTaskService.ensure` with deterministic IDs and retry-safe Study relation (`StudyEvidenceLink.targetType='assessment'`).
- **Calendar**: an eligible active `exam` milestone projects one `assessment-deadline` event with the **same id/canonicalSourceId as the legacy 007 projection** (replacement, not duplication); other milestones project distinct `exam-milestone` events; unknown/unverified/cancelled/archived are excluded; `originalLocal` + zone shown next to viewer-local time. Legacy verified assessments without milestones keep their 007 projection unchanged.
- **Resume**: `assessment`, `course-past-paper`, `exam-practice` entity types validated by offering ownership and archive state; safe Overview fallback.
- **UI**: `/study/courses/:id/exams` active (Labs/Notes stay Future); Upcoming & Registration / Past Papers / Practice & History views; three `InspectorShell` inspectors with `returnFocusTo`; `?assessment=` / `?paper=` / `?practice=` deep links (conflicts keep the first by that order, unknown IDs show a non-destructive notice); Overview exam summary derived from the same records.

## Changed files

| File | Change |
|---|---|
| `src/features/study/types.ts` | 009 types; `StudyState` v3 arrays; `StudyEvidenceLink.targetType` + `'assessment'` |
| `src/features/study/services/studyCourseService.ts` | schema 3, v1/v2 migration dispatch, seed arrays |
| `src/features/study/services/examDates.ts` | new — date/zone/DST validation |
| `src/features/study/services/studyExamService.ts` | new — exams domain service |
| `src/features/study/components/ExamsView.tsx` | new — Exams tab UI and inspectors |
| `src/features/study/components/CourseWorkspace.tsx` | exams section, Overview exam summary card |
| `src/features/study/components/StudyTabs.tsx`, `src/App.tsx` | enable Exams route only |
| `src/services/globalCalendarService.ts`, `src/components/GlobalCalendarPage.tsx` | exam projection, `exam-milestone` source, original local time display |
| `src/services/globalResourceService.ts` | `ResourceEntityType` + `'course-past-paper'` |
| `src/services/workspaceResumeService.ts` | 3 new validated resume entity types |
| `src/styles.css` | Module 009 styles (desktop/tablet/mobile) |
| `src/features/study/StudyLearning.test.tsx` | 008 v1 migration assertion now expects `targetSchemaVersion === 3` (only change) |
| `src/features/study/StudyExams.test.tsx` | new — 26 tests |
| `.github/workflows/module-009-ci.yml`, `tools/ci/module-009-browser-smoke.mjs` | scoped CI + browser smoke |

## Migration backup and failure-injection proof (tests)

- v1→v3: backup metadata `{stage:'schema-migration', sourceSchemaVersion:1, targetSchemaVersion:3}`, backup envelope still v1; legacy verified assessment, `past-papers` manual classification and resource progress IDs preserved; past-paper classification does not become an assessment or calendar event.
- v2→v3: every 008 Unit/Set/Item/Attempt/progress/evidence record deep-equal before/after.
- Injected backup failure → load rejects, stored envelope remains v2. Injected commit failure → rejects, stored v2 data deep-equal; retry after recovery succeeds to v3.
- Stored schema 4 → rejected, data untouched; incomplete v2 → `Unable to migrate`, data untouched.

## Real-browser evidence (CI run 45047487262, cloud Chrome)

| Viewport | Overflow (list / inspector / papers) | Create → auto-open inspector, focus inside | Escape → focus | Deep-link reload (IndexedDB) | DST gap rejected in UI |
|---|---|---|---|---|---|
| 1440×900 | none (1425 ≤ 1440) | yes, inspector 440px at x=985 | `New assessment title` | persisted | yes |
| 1024×768 | none (1009 ≤ 1024) | yes, 460px at x=549 | `New assessment title` | persisted | yes |
| 390×844 | none (390 = 390) | yes, full-screen 390×844 | `New assessment title` | persisted | yes |

Also verified: Exams tab active, `Unknown date` shown for the undated demo exam, Past Papers empty state, unknown `?practice=` deep link shows a notice, Overview exam card, Calendar shows exactly one event per exam with `Original: <date> 09:00 · Europe/Berlin · user-confirmed · exact`. Console errors: **0**. Separately reported (not counted as failure): Chrome's default `/favicon.ico` 404 — `index.html` declares no favicon (pre-existing).

## 30-row developer self-check (frozen rows verbatim; developer evidence only — not independent QA)

| # | Frozen acceptance row | Dev result | Evidence |
|---|---|---|---|
| 1 | Exams route opens correct `CourseOffering`; cross-semester assessment/sitting data does not leak. | PASS | Route test + browser; tests "creates assessments with stable ids and rejects foreign offerings", "records sittings … keeps history per offering" (other offering: own `sittings=[]`, read-only labelled `courseHistory`, foreign update → not found) |
| 2 | 007 existing Assessment IDs/data survive; Exams tab is functional only after real implementation. | PASS | v1→v3 test preserves `assessment-legacy` exactly; legacy test keeps `officialDateTime/verified/originalTimezone`; Exams tab enabled in this PR only |
| 3 | Create/edit/archive real Assessment has stable ID and validated type/offering ownership. | PASS | stable-id test (invalid type rejected, foreign offering rejected, id unchanged on update); archive/cancel tests |
| 4 | Past Paper metadata is **not** a real Assessment and importing a Past Paper never invents an exam date. | PASS | "catalogs one canonical Resource without creating an assessment, date or copy" (assessments/calendar unchanged); v1 `past-papers` classification not projected |
| 5 | Unverified/unknown exam dates clearly display Unknown/Tentative, not official confirmed. | PASS | calendar excludes unknown/unverified; unknown cannot be confirmed; UI `Unknown date` + `Tentative · unverified` (unit + browser) |
| 6 | Date-only confirmed exam events display date without fabricated time/00:00. | PASS | `normalizeExamDate` rejects time on date-only; calendar item `precision:'date-only'`, `start/end` undefined; Overview shows `Date known, time unknown` |
| 7 | Exact exam date preserves local time, IANA timezone and DST conversion. | PASS | DST gap/fold tests (Europe/Berlin 2026-03-29 / 2026-10-25 02:30), round-trips across Berlin/Tokyo/New York and month boundary; stored `localDate/localTime/timezone/instant`; browser calendar `Original: … 09:00 · Europe/Berlin` |
| 8 | A corrected date retains provenance/history and stops displaying superseded milestone as upcoming. | PASS | supersede test: old milestone `superseded` with `supersededById` and source note; calendar shows only new date |
| 9 | Cancelled real exam preserves history and is excluded from current upcoming projections. | PASS | cancel test: calendar + Overview summary exclude it; milestones retained; lifecycle `cancelled` |
| 10 | Registration open/close, withdrawal close and actual exam time are separate milestones and never overwrite each other. | PASS | four kinds coexist as active milestones; distinct calendar `exam-milestone` events + one exam event |
| 11 | Registration status only changes after explicit user action; no third-party university-system claim. | PASS | only `setRegistration` changes it; history test; UI copy "no university system is contacted or updated" |
| 12 | An unknown registration status is not silently converted to Registered/Not registered. | PASS | new assessment and after adding milestones remains `unknown`; invalid status rejected |
| 13 | An actual ExamSitting is separately recorded, can include absence/withdrawal, and is never created by passing time. | PASS | past-dated exam → `sittings=[]`; absent sitting recorded explicitly |
| 14 | Official/self-reported result sources remain distinct; numeric grade does not auto-infer PASS/FAIL. | PASS | grade `4.0` keeps outcome `pending`, source `self-reported`; official without evidence rejected; pass with absence rejected |
| 15 | Multiple attempts/historical sittings across offerings remain distinct and recoverable. | PASS | `courseHistory` lists other-term sittings with term labels; ids preserved; not editable cross-offering |
| 16 | Past Paper catalog references **one canonical Global Resource** and offers optional solution linkage without copying bytes. | PASS | resource count unchanged; `course-past-paper` links for question/solution; same-resource solution rejected |
| 17 | Same Past Paper explicitly reused across offerings preserves paper identity but never copies progress/Task/TimeEntry. | PASS | reuse test: explicit idempotent link (concurrent), practice/tasks empty in new term, practice blocked before link, foreign course rejected |
| 18 | Missing/other-device paper file availability retains paper and practice history; Open Original capability-gated. | PASS (unit) | `another-device` paper keeps paper+practice; `openOriginal` rejects; UI button disabled unless `available-provider`. Not exercised in browser smoke (no file-backed Resource in cloud run) |
| 19 | Practice status/score is explicitly entered; missing max points shows Unknown, not fake completion/percentage. | PASS | `practicePercentage` undefined without denominator; >max/negative/zero rejected; UI "max unknown" |
| 20 | Practice score and actual official exam result never mix or update each other. | PASS | practice updates leave sittings/assessment untouched |
| 21 | Optional per-question practice uses canonical Module 008 Sets/Items/Attempts; repeated mapping avoids duplicate Items. | PASS | concurrent + repeated mapping → one deterministic set; 008 item dedupe (`A1`/`a1`) |
| 22 | Past Paper source import/open/solution view does not mark questions solved or a Unit mastered. | PASS | mapping creates no items/attempts/progress; `queryProgress` unchanged |
| 23 | Canonical Task created from an Exam/Milestone is idempotent and appears as one Task, with failure/retry reconciliation. | PASS | concurrent `Promise.all` → one task; injected Study relation write failure → truthful error; retry → one task, links reconciled |
| 24 | Task dueDate, Calendar PlannedSession, registration milestone and exam date remain separate canonical facts. | PASS | task has no dueDate by default; after due date + day plan, exam/registration milestones and calendar items unchanged |
| 25 | Calendar shows one stable exam event and distinct registration/withdraw milestones with truthful date precision; no duplicate 007 projection. | PASS | legacy replacement test (exactly one `calendar-assessment:assessment-legacy`); browser 1 event per exam |
| 26 | Global Timer/TimeEntry actual seconds unchanged by self-reported mock duration; no auto Timer start. | PASS | `selfReportedMinutes:120` → `TimeEntryService.list` empty; Timer only via explicit button |
| 27 | Exam/Practice/Resource Resume links resolve stable IDs and safe fallbacks after archive/deletion. | PASS | resume test: valid → archived assessment/paper fall back to Overview; other-offering practice invalid |
| 28 | v1→v3 and v2→v3 migration preserve legacy 007 verified assessments/resource marks and 008 state, with backup and failed-migration safety. | PASS | four migration tests (see above) |
| 29 | Real browser 1440/1024/390 no overflow; shared Inspector Escape and create-focus restoration, keyboard/ARIA, unknown/error/permission states. | PARTIAL | Cloud Chrome: no overflow, Escape/focus, ARIA roles PASS (browser table above + UI tests (create→Escape→input focus; card→Escape→card focus). ); permission-required state only covered by unit/UI tests, not exercised in the browser run; no Windows host test |
| 30 | Existing 001–008 regressions plus Typecheck, Lint, Build, Tests, git diff check pass; independent Review Only QA reports actual 30-row results and exact SHA. | PASS (developer part) | CI: all commands pass, 186/186 incl. all 160 baseline; independent QA pending |

## Known limitations / for QA attention

1. **Node version**: CI uses Node 24 because of the pre-existing Node 22 jsdom ZIP issue (not touched).
2. **Browser scope**: cloud headless Chrome on Linux only; no Windows host, no native folder picker, no file-backed Resource open in the browser run.
3. **Legacy + milestone policy**: once an assessment has an *active* `exam` milestone (any verification), the legacy 007 projection for that assessment is replaced; if that milestone is unverified, the assessment has no calendar event until confirmed. Rationale: the user's latest explicit entry supersedes the legacy date and must not appear twice. Design Window may rule otherwise.
4. Legacy verified exams are **not** auto-backfilled into milestones (design allows but does not require it); they keep their exact 007 projection.
5. A registration-milestone Task (`ensureExamTask(…,'registration')`) is per assessment, not per milestone.
6. `?assessment=` etc. resolution order on conflict: assessment > paper > practice.
7. One assertion in the 008 suite changed (`targetSchemaVersion` 2 → 3) because the migration target legitimately changed.

## Requested independent QA

Review Only against the exact PR head in the PR comment: reproduce the five commands (or verify the CI run for that SHA), DST gap/fold, migration failure injection, cross-offering isolation, Task idempotency/retry, calendar non-duplication, and all **30 frozen rows**. Return ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE. Design Window alone decides remediation and merge.
