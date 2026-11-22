# Personal Workspace — Module 009 — Execution Instruction: Exams & Past Papers V1.0

**Design Window v0.0.2** · **2026-11-22 (Europe/Berlin)**  
**Status:** **IMPLEMENTATION INSTRUCTION APPROVED — execution only under separate explicit start authority**.  
**Product design:** [`DESIGN_APPROVED.md`](./DESIGN_APPROVED.md) (APPROVED / FROZEN; 30 frozen acceptance rows).  
**Required technical preflight:** [`CURRENT_MAIN_INTERFACE_AND_MIGRATION_AUDIT.md`](./CURRENT_MAIN_INTERFACE_AND_MIGRATION_AUDIT.md).  
**Required OSS decision:** [`OSS_REUSE_REVIEW.md`](./OSS_REUSE_REVIEW.md).  
**Operator:** the user-initiated, interactive Claude Code Development / Execution Window under a **separate** [Module 009 start authorization](./MODULE_009_START_AUTHORIZATION.md), not any old Module 008 one-time merge delegation.  
**Never treat this document alone as permission to begin coding or merge.**

## 0. Non-negotiable workflow and read order

1. Read **all** of the frozen design, current-main audit, OSS review, Module 008 final STATUS, and the **separate start authorization**. Verify the new Module 009 issue before coding.
2. Re-fetch actual `main` and upstream Module 007/008 accepted merge ancestry. Verify `git status --short` is clean, correct origin, `git branch --show-current`, `git rev-parse HEAD`, no conflicting worktrees or pending user edits. If the current source contracts are materially different from the audit, **STOP**.
3. Work only on a **new isolated Module 009 branch from latest clean main**, using the agreed repository branch name `codex/module-009` (historical branch naming is not a claim that Codex is the executing agent). If an unexpected existing branch exists, STOP instead of overwriting it.
4. Implement only the scope in frozen `DESIGN_APPROVED.md`. Don't modify 007/008 behavior except necessary, tested, explicitly listed shared-contract extensions. Do not run background agents or claim that posting to GitHub auto-dispatches work.
5. Publish a PR targeting `main` and a `QA_HANDOFF.md` with exact commit HEAD, changed files, tests/browser proof, migration backup proof, regressions, known limitations and a **30-row developer self-check**. STOP for **independent Review Only QA**. Developer self-check is not independent acceptance.
6. Design Window alone decides ACCEPTED/REMEDIATION/MERGE after independent QA. **This is development authorization, never an implicit merge authorization.**

## 1. Frozen product scope / implementation deliverables

**A. Exam assessments and milestone management**
- Existing `CourseAssessment` remains the canonical real assessment record under the same CourseOffering. Support create/edit/archive/cancel with correct `assessmentType`, stable immutable IDs, evidence/verification and **distinct** registration-opening, registration-closing, withdrawal and exam-date milestones.
- Date precision must be `unknown`, `date-only` or `exact`; verification must distinguish unverified, user-confirmed, source-verified and legacy-verified; cancelled/superseded preserved but not projected as upcoming.
- Manual registration status `unknown/not_registered/registered/withdrawn/not_required`; no claim of automatic RWTH/university registration or source verification without evidence.
- Real exam sitting participation and official or user-reported result/grade are explicit history objects. Do **not** compute official passed/failed from grade thresholds, date passing or practice score.

**B. Course-wide Past Paper catalog**
- Model a historical exam/sample/mock paper as distinct from `CourseAssessment`, cataloged by `courseId` with **explicit** links into current `CourseOffering`.
- Question/solution are existing **GlobalResource IDs**, not copies of bytes. The user chooses actual links and source evidence; `Altklausur` filename or Material classification never creates a real exam deadline, progress or official sitting.
- Same paper ID can be reused across offerings, but practice, Task and attempt history never transfer without explicit action.
- Missing/off-device PDF keeps metadata and practice. Opening original bytes must pass existing `GlobalResourceService` permission/availability checks.

**C. Paper practice and per-question reuse**
- Paper-level `PastPaperPractice` session with explicit planned/in progress/completed/abandoned state, user-entered points/denominator, optional self-reported duration and notes. Unknown denominator never invents 0%, full points or a pass.
- Optional explicit link to 008 `CourseExerciseSet` and existing Items/Attempts. Repeat mapping idempotent; do not duplicate question tables or auto-extract PDF question list.
- Practice scores never become official assessment grades. Self-reported minutes never automatically become a TimeEntry or start Timer.

**D. Canonical integration and UX**
- Activate **only** `/study/courses/:courseOfferingId/exams` in existing course tabs; Labs/Notes remain Future. Build usable Upcoming/Registration, Past Papers and Practice & History views, responsive 1440/1024/390.
- Reuse `InspectorShell` with valid `returnFocusTo` for create→auto-open→ESC and existing-row selection. Show unknown/unverified/cancelled/error/permission-required states plainly and keyboard-accessibly.
- Course Overview shows truthful relevant exam summary. Shared Global Calendar projects one canonical real exam and distinct registration/withdrawal milestone events without duplicating old 007 `assessment-deadline` items. **No all-project Calendar rewrite**: current shared query is scoped by project/offering.
- Integrate exam-preparation Task using `GlobalTaskService.ensure`, stable canonical source ID, explicit relations and idempotent partial failure retry. Task dueDate, exam date, registration deadline, PlannedSession and actual TimeEntry remain independent.
- Exam/Practice/Past Paper resume uses distinct validated entity types; never hijack Research `paper` or auto-start Timer.

## 2. Required technical changes, bounded to actual accepted interfaces

Refer to [the full current-main audit](./CURRENT_MAIN_INTERFACE_AND_MIGRATION_AUDIT.md) for exact source facts. Likely files (actual latest code must be checked): `src/features/study/types.ts`, `src/features/study/services/studyCourseService.ts`, one **new offering-scoped exams service and exams component** in `src/features/study/`, `StudyTabs.tsx`, `CourseWorkspace.tsx`, `src/App.tsx`, `globalCalendarService.ts`, `GlobalCalendarPage.tsx`, `globalResourceService.ts`, `workspaceResumeService.ts`; `globalTaskService.ts` only if its existing `ensure` contract truly lacks needed capability. Add tests in existing Study/Calendar/Resume/Resource suites and a new 009-focused suite. Do not clone an entire service stack.

### 2.1 Schema v3 & migration

- **One canonical `StudyRepository` on domain `study-courses`**. Change `schemaVersion` **2 → 3**; leave `seedVersion` and IndexedDB root database version unless demonstrably necessary and approved. Never add `exam-db`, `pastpaper-db` or free-floating `localStorage` stores.
- Explicit `fromVersion===1` and `fromVersion===2` migration paths, preserving the exact v1→v2 normalization for legacy resource progress and carrying all Module 008 arrays unchanged into v3; initialize new exam arrays empty.
- Existing legacy `CourseAssessment.id/offeringId/officialDateTime/originalTimezone/provenance/verified/registrationStatus` remain unchanged in meaning. Any compatibility milestone for verified legacy exam uses deterministic identity and `legacy-verified`, **never** invents `source-verified`.
- Repository already backs up stored envelope before schema migration: **prove** backup metadata and failure behavior with `MemoryPersistenceAdapter` and injected backup/write exceptions. Single final v3 write; no intermediate destructive v2 write for old v1 data. Unsupported `schemaVersion>3` rejects safely.
- Every create/update validates stable scoped foreign keys, entity uniqueness, archival/cancel state and property-presence behavior (omitted optional patch fields must never erase saved metadata — M008-QA-001 regression). No rekeying 007/008 entities.

### 2.2 Dates, timezone and validation

- Internal domain model uses plain `YYYY-MM-DD` for `date-only`, and explicit local `YYYY-MM-DD` + `HH:mm` + IANA timezone for zoned exact; derive absolute instant only after validating the combination.
- Do not use `Date.parse` or `new Date(string)` as sufficient validation for user input, nor assign `00:00` to unknown-hour events. Parse strict ISO shape, reject invalid calendar days, malformed offsets, DST gaps and ambiguous folds (or prompt user for an explicit disambiguation choice). Preserve original local time and source timezone through round-trip.
- **Deterministic DST tests:** `Europe/Berlin 2026-03-29 02:30` is nonexistent; `Europe/Berlin 2026-10-25 02:30` is ambiguous. A valid time and date-only conversion must round-trip correctly. Test different viewer zones and month boundaries.
- Current `GlobalCalendarService` legacy assessment projection is exact-only using `officialDateTime.slice(0,10)`; replace with backward-compatible one-event-per-assessment projection and milestone-specific source IDs, not duplicate legacy items. Avoid time display that silently uses browser local timezone without explaining it.
- Library decision: three candidates compared in [OSS_REUSE_REVIEW](./OSS_REUSE_REVIEW.md). **Conditionally permitted:** at most one timezone dependency, preferred `@js-temporal/polyfill` to handle PlainDate / ZonedDateTime / disambiguation. Before install verify package license/compatibility and pin a reproducible version; after install report lockfile/bundle delta, browser tests, `npm audit` findings where applicable. Do not add `luxon` or `@date-fns/tz` additionally without Design Window approval. If selected library fails, STOP and report a substitution proposal; do not silently choose a new dependency.

### 2.3 Cross-service ownership and partial failures

- `ResourceEntityType` currently uses `paper` for Research literature; give course Past Paper a distinct typed relation (e.g. `course-past-paper`) if needed. Link once, keep existing Resources/ResourceLocations canonical and bytes unchanged.
- Maintain stable `CoursePastPaper` identity by `courseId`, explicit `PastPaperOfferingLink` to offering, and offering-scoped `ExamSitting/PastPaperPractice`. Reject using IDs from unrelated offerings/courses. Source file re-scan must preserve all manual paper/result/practice state.
- GlobalTask `ensure` handles canonical ID; new exams flow must prove concurrent `Promise.all`, repeated open/create, partial Study relation failure, clear error and successful idempotent retry without duplicate Task IDs or links. Never create a duplicate Task store.
- Resume type must represent exam assessment, past-paper and practice separately from existing Research literature `paper`; validate ownership and existence, safe route fallback on missing/archive, preserve timer opt-in.
- TimeEntry remains a separate, canonical timer-session idempotent actual record; self-reported mock duration does not mutate it.
- Do not rewrite Research or Work domains to make the 009 feature work. If a shared global API design conflict is material, **STOP**.

## 3. Required proof before QA handoff

**Pre-change**: actual branch/main remote SHAs, clean worktree, no unmerged or hidden user edits, accepted ancestry `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08` and `48558a862b299b030fbd680aa9677115c92ca773`, current source-contract diff vs audit. Confirm package lockfile state before dependency change.

**Data/migration tests**: v1→v3 and v2→v3, backup before write, corrupt/unsupported versions, injected backup/write failure, preserving IDs and 007 classifications/progress/source rescan and 008 Unit/Item/Attempt/evidence, 009 foreign keys and per-offering data isolation. Never seed user history with mock results.

**Business tests**: unverified/unknown/date-only/exact, DST gap/fold, separate registration dates/states, changed verified date, cancelled/superseded source and UI, actual sitting/result vs practice score, historical multiple offerings, Past Paper resource references and availability, no fake exam from ZIP, score unknown denominator, 008 set/item idempotency and unchanged mastery, shared Task concurrency/retry, Calendar no duplicate event and no Task date pollution, Resume fallback, timer actuals unchanged.

**Real browser**: actual application at **1440×900, 1024×768, 390×844**; initial empty, populated, missing permission, newly created Assessment/Paper/Practice, ESC return focus from auto-open, deep-link persisted reload, correct date display, no horizontal overflow or console errors. Document environment and screenshots/DOM evidence. Cloud-only browser testing must not be labeled Windows native file-picker validation.

**Commands** (report actual outputs and exit codes, never invent):
```bash
npm run typecheck
npm run lint
npm run build
npm test -- --run
git diff --check
```

Existing baseline QA: Module 008 accepted 160/160 tests at SHA `d366710e51f5f4ab1cb6a10cb2919c46549afaed`. This is historic baseline, not a promise of a particular post-009 test count. Retain 001–008 regressions; new tests should expand count, and zero new lint errors/warnings must be evidenced (12 existing Research warnings may remain but must be identified).

**Frozen acceptance matrix:** copy each of the **30 numbered acceptance rows** from [DESIGN_APPROVED.md §10](./DESIGN_APPROVED.md#10-approved-and-frozen-30-row-implementation-acceptance-matrix-design-only--not-qa-results) verbatim into `QA_HANDOFF.md` with `PASS / PARTIAL / FAIL`, exact test/browser/commit evidence, and known gaps. A developer's 30 PASS claims do not waive independent QA.

## 4. Required handoff deliverables

- PR opened to `main` from isolated `codex/module-009` branch; do not merge.
- `docs/handoffs/009/QA_HANDOFF.md` on that branch only, with exact final candidate SHA **published in the PR handoff comment after the last docs commit** (do not put an in-tree self-invalidating HEAD).
- `docs/handoffs/009/STATUS.md` on the code branch updated factually to `IMPLEMENTED / PR OPEN / INDEPENDENT QA PENDING / MERGE HOLD`; preserve main authorization history.
- Changed file matrix and implementation chronology, dependency license and bundle changes, migration backup proof, five command results, real browser evidence, full **30-row developer self-check**, remaining limitations, evidence for 007/008 non-regression, any unresolved risks.
- PR and Module 009 issue comments with direct handoff links and final exact HEAD. **STOP** and request independent **Review Only** QA. QA must not edit branch or merge, must reproduce key failure modes and all 30 frozen rows.

## 5. STOP & forbidden scope

Stop immediately for: SHA/branch/worktree mismatch, upstream interface conflict, migration corruption/lost legacy IDs, cross-offering leakage, inaccurate date/DST semantics, duplicate canonical Resource/Task/Calendar/Exercise entities, unsupported package/security issue requiring alternate library, failing tests not explained, or any need for unapproved unrelated module changes. Report the actual state and request a Design Window decision. No forced reset, forced push, destructive rebase, silent historical overwrite, or merging without a new explicit Design Window merge authorization.

**Explicitly NOT AUTHORIZED:** Module 010 Labs; B2B/B3; always-on AI/dots, unattended scheduler, watcher, daemon, real Codex Queue, auto university login/deadline scraping, automatic grading/OCR, cloud data sync, or a new app backend.

**Final instruction to Development Window:** implement only after the separate start authorization becomes active; once PR and evidence are ready, STOP for independent QA. No source or product-code action occurs by publishing this document.
