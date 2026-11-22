# Personal Workspace — Module 009 Study Workspace / Exams & Past Papers V1.0 — DESIGN DRAFT

**Design status:** **DRAFT / UNDER INDEPENDENT DESIGN REVIEW / NOT APPROVED / NOT FROZEN**  
**Date:** 2026-11-22 (Europe/Berlin)  
**Owner:** Design Window v0.0.2  
**Implementation:** **NOT AUTHORIZED / NOT STARTED**  
**Independent QA:** NOT APPLICABLE — no candidate implementation exists.  
**Scope:** Study Workspace Exam Events, registration/de-registration milestones, actual exam sittings/results, Past Paper resource catalog, manually logged practice sessions, and shared system projections.  
**Source-of-truth code baseline:** `main` at `07dd45933afb76df4a128dca08cabcde5721099a`, after Module 008 merge `48558a862b299b030fbd680aa9677115c92ca773`. This is a design evidence anchor, **not a code-start authorization**.

> **Design gate:** Merely opening the Module 009 design review does **not** authorize Claude Code, Windows Codex, another agent, or an automation to implement 009, create an execution branch/PR, change schemas, merge anything, or begin Module 010. The user and Design Window must first review/approve the product decisions, publish a distinct frozen `DESIGN_APPROVED.md`, perform actual-current-main interface preflight, then issue a **separate explicit implementation start authorization**.

## 1. Authoritative prior contracts (source verified)

- [Module 007 accepted design](../007/DESIGN_APPROVED.md): `Course` versus `CourseOffering`; `CourseAssessment` for actual exams/testats/reports; `Past papers` are classified materials, **not real future exam events**; verified events may project into Calendar; Resources and Task/TimeEntry remain global canonical.
- [Module 008 accepted design](../008/DESIGN_APPROVED.md): learning-unit and exercise-item/attempt state remain independently manual; **009 must not duplicate** CourseExerciseItem/Attempt or infer mastery/solved from file open, solution presence, time spent or correct attempt. `Exams` tab remains explicitly Future until implementation and QA.
- [Module 008 final status](../008/STATUS.md): **MERGED / FINAL CODE ACCEPTED**, independent QA **30 PASS / 0 PARTIAL / 0 FAIL**, Issue #17 closed, original REJECTED history preserved.
- Actual source: `src/features/study/types.ts` defines `CourseAssessment {id,offeringId,assessmentType,title,officialDateTime?,originalTimezone?,provenance?,registrationStatus?,verified}`. Existing `study-courses` repository is **schema v2**. `StudyCourseService.saveAssessment` uses the same canonical `assessments` array. `GlobalCalendarService.query({projectId})` currently projects verified dated assessments, using `sourceType='assessment-deadline'` with course Overview route. `StudyTabs` has `exams` disabled as Future.
- Important **actual interface limit**: present calendar queries are project/offering-scoped (defaulting to a Research project), not an implemented all-areas multi-project aggregate. Integration with this shared Calendar is mandatory; claiming a global all-areas unified view already exists is prohibited. Any cross-project aggregated calendar redesign requires a separate design approval or expressly limited new contract in this module.

## 2. Product problem and required user outcomes

One course may have multiple exam offerings, a registration period, a withdrawal deadline, an exam date whose time is not yet known, multiple formal sittings over terms, and practice with several historical or mock papers. The system must allow a user to:
1. Record a real upcoming exam/Testat and its **confidence, source, date precision, original timezone and mutable verified status**, without making up unknown details.
2. Track **registration / withdrawal / eligibility** as manually confirmed facts and distinct deadline milestones, not as a Task Done proxy or an LMS integration.
3. Record **real exam sitting and result** (taken, absent, passed/failed, grade as known) as historical evidence, separate from *practice* and self-estimated grades; preserve across future terms.
4. Curate previous years' exam PDFs and solutions as existing **canonical Resource IDs** and optionally track mock/practice papers without assuming files were solved.
5. Use existing 008 learning units/exercise items and one Global Task/Calendar/Timer/TimeEntry/Resume infrastructure when the user explicitly chooses them.
6. See what is upcoming, registration-required, still unverified, practiced or historically attempted at a glance, while retaining proper per-offering scope.

## 3. V1 scope and strict exclusions

**V1 proposed IN scope**
- A real Exams tab in Course Workspace: Upcoming / Registration / Past Papers / Practice & History views using a shared Inspector shell.
- Manual CRUD and clear state transitions for exam-centric `CourseAssessment` records and distinct dated milestones; source evidence, verification, corrected date history, cancellation.
- Track registration state, important dates, and independently reported exam sitting/results. **No automatic grade/pass inference.**
- Past Paper catalog as *metadata referencing existing Resource IDs*, links to question paper and optionally solution, year/term/type; explicit offering link for reuse across semesters.
- Manually created Past Paper practice sessions with self-reported score/notes/status; optional per-question tracking by explicitly creating/linking **008 CourseExerciseSet/Item/Attempt**, not a duplicate question table.
- Course Overview and existing shared Calendar projection; optional user-confirmed Global Task for exam preparation; Continue/Resume stable deep links.
- Safe schema v2→v3 migration preserving v1→v2 compatibility, backups, all 007 and 008 canonical identities.

**OUT of scope**
- Automated university registration/withdrawal or account logins, deadline scraping, official grade retrieval, LMS API without separate permission/connector.
- OCR/PDF question extraction, answer grading, automatically inferred correctness, mastery or pass/fail.
- Automatic spaced repetition, study schedule generation, AI study coach, reminders/background watchers/notification sender.
- Replacing the existing Task/Calendar/TimeEntry/Resource/Exercise stores or implementing a general-purpose file manager.
- Module 010 Labs/Testat workflow engine; a Testat-type assessment can be recorded here as an event only.
- Any arbitrary local filesystem read/write or automatic native app launch.
- Unapproved global cross-area calendar architecture rewrite.

## 4. Precise terminology and canonical ownership

| Entity | Meaning / canonical owner | Must never be mistaken for |
| --- | --- | --- |
| `CourseAssessment` | Real scheduled or tentative exam, quiz, Testat, report or assignment event within a CourseOffering; existing `study-courses.assessments` | A historical exam PDF or the user's solved exercise |
| `ExamMilestone` (proposed) | Registration opening/close, withdrawal deadline, verified exam date, grade-release expectation etc.; linked to existing CourseAssessment ID | Global Task dueDate, PlannedSession or a second actual exam object |
| `ExamSitting` (proposed) | An actual historical occurrence/participation/outcome, user-confirmed and offering-scoped | A mock/Past Paper practice session |
| `CoursePastPaper` (proposed) | Metadata for a prior exam, sample paper or mock; references one or more Global Resource IDs and owning `courseId` | Actual Exam / CourseAssessment |
| `PastPaperOfferingLink` (proposed) | Explicit membership of a Past Paper in a learner's `CourseOffering` | Auto-transfer of progress between semesters |
| `PastPaperPractice` (proposed) | An explicitly created practice run for one Past Paper in the current offering; self-reported paper-level outcome | An official sitting/grade, automatically measured TimeEntry or per-question Attempt |
| `CourseExerciseSet/Item/Attempt` (008) | Canonical optional per-question problem practice; link explicitly to a Past Paper | An additional Module 009 duplicate question/attempt store |
| Global `Resource/Task/Calendar/TimeEntry/Resume` | Shared canonical services and derived routes | New Module 009 private copies |

**Identity:** all 009 records use stable, immutable IDs and validated foreign keys. Assessment and Sitting always belong to the actual `CourseOffering`. A Past Paper may be cataloged once for a `Course` and explicitly linked to multiple offerings, but its **practice sessions, attempts and task state never silently cross offerings**.

## 5. Exam dates, source verification and registration model

### 5.1 Date precision and truthful evidence

An `ExamMilestone` carries `datePrecision='unknown'|'date-only'|'exact'`, `localDate?` (YYYY-MM-DD), `localTime?` (HH:mm, required only for exact), `timezone?` (IANA when known), `verificationStatus='unverified'|'user-confirmed'|'source-verified'|'legacy-verified'`, `sourceUrl?`, `sourceNote?`, `status='active'|'superseded'|'cancelled'`. Do not store a guessed 00:00 for date-only events; never convert an unknown exam clock time to midnight or mark it source-verified without evidence. Local dates and IANA timezone must round-trip across DST transitions. Missing timezone must be displayed as unknown, not silently assumed to be local Germany time.

- `unknown`: no confirmed date; show clearly, not in calendar as dated event.
- `date-only`: display date without invented time; if user/source confirmed, project as **all-day/date-only** Calendar item with truthful precision.
- `exact`: display original local clock time + supplied timezone and derived instant only after validation; uncertain timezone is explicit.
- `unverified`: display as tentative in Exams; do not label as an official exam deadline; inclusion in Calendar only after deliberate user confirmation under an explicit tentative visual convention if approved.
- `cancelled/superseded`: preserve historical records, remove superseded date from current upcoming projections, do not delete evidence.

**Compatibility:** Existing 007 `CourseAssessment.officialDateTime`, `originalTimezone`, `verified`, `provenance`, and `registrationStatus` must remain preserved in migration. A pre-existing `verified=true` can be represented as `legacy-verified` without upgrading it to `source-verified`; do not lose its existing Calendar visibility or original date/time. The old `CourseAssessment` remains canonical; milestones are subordinate and must not generate two calendar entries for the same real exam.

### 5.2 Registration and deadlines

Proposed manual registration states: `unknown`, `not_registered`, `registered`, `withdrawn`, `not_required`. A registration opening date, registration deadline, deregistration/withdrawal deadline and actual exam time are **separate milestones**, each with separate precision and verification evidence. A registration deadline is not the exam start; recording a Global Task due date does not modify either milestone. Registration status changes require explicit user action with optional evidence and event log; never pretend RWTH CAMPUS or a third-party system was actually updated.

### 5.3 Actual exam sitting and result

Proposed `ExamSitting`: `id,offeringId,assessmentId,sittingLabel?,participationStatus,examDateReference?,outcomeStatus,gradeValue?,gradeSource,gradeSystem?,evidenceResourceId?,notes?,createdAt,updatedAt`. Distinguish `not_taken / attended / absent / withdrawn / unknown` participation from `unknown / pending / passed / failed / void` result. A grade may be `self-reported` or `official-evidenced`; do not infer pass/fail from numeric grade. Multiple attempts across terms appear in the Course history while retaining their original offering and assessment identities. No automatic insertion of a sitting merely because exam date passed.

## 6. Past Papers and self-reported practice

### 6.1 Paper catalog

`CoursePastPaper` fields (proposed): `id,courseId,label,originTerm?,year?,paperKind='past-exam'|'mock'|'sample'|'unknown',questionResourceId,solutionResourceId?,maxPoints?,durationMinutes?,notes?,archivedAt?,createdAt,updatedAt`. The question PDF is an existing `Resource` and must be deliberately confirmed/linkable; source metadata remains provenance. No PDF bytes copied or rewritten. Historical term embedded in a filename may become a **low-confidence suggestion**, not verified metadata until user confirms.

A `PastPaperOfferingLink` explicitly relates one paper to one current offering. Same canonical paper may be reused across offerings without copying canonical Resource. Missing permission to open original leaves paper metadata and practice history intact.

### 6.2 Practice session

`PastPaperPractice` fields (proposed): `id,offeringId,paperId,status='planned'|'in_progress'|'completed'|'abandoned',startedAt?,completedAt?,selfReportedMinutes?,scoredPoints?,maxPointsAtAttempt?,scoreSource='self'|'external-reviewed'?,notes?,linkedExerciseSetId?,createdAt,updatedAt`. The user explicitly controls status; starting or finishing a practice does not automatically create a Timer/TimeEntry or mark exercise items solved. Score percentage exists only when both explicit points and a positive denominator are known, and is tagged **practice/self-reported**, not official examination grade.

Optional question-level tracking: explicit user action to map a paper to an **existing or new offering-scoped Module 008 ExerciseSet** and 008 Items/Attempts; avoid duplicate item creation on repeated link and preserve 008 append-only Attempts. V1 does not parse a PDF into questions or silently generate an exercise denominator.

## 7. Navigation / UX (proposed)

- `/study/courses/:courseOfferingId/exams` becomes functional; course tabs: Overview / Materials / Progress / Exercises / Exams / Labs (Future) / Notes (Future).
- Within Exams: **Upcoming & Registration**, **Past Papers**, **Practice & History** as in-page filters, not new global entities.
- Deep link `.../exams?assessment=<id>` for real assessment Inspector, `.../exams?paper=<id>` for a Past Paper Inspector, `.../exams?practice=<id>` for practice detail; conflicting query IDs are resolved safely without inventing state.
- Actual exam card: title, offering, date precision and original timezone, verification badge/text, registration status, milestones (registration close / withdraw / exam), optional sitting/result. The view must distinguish `Unknown date`, `Date known, time unknown`, `Tentative`, `Verified`, `Cancelled`.
- Paper card: year/term, linked question/solution Resources, device availability, number of practice sessions, user-selected offering; no automatic score on import.
- Practice detail: explicit status, self-reported points, attempt notes and optional 008 per-question link. Open source only through existing Resource capability check.
- Use existing **InspectorShell**, keyboard Escape/focus restoration on create and selection, mobile fullscreen at 390px, tablet 1024px and desktop 1440px no overflow.
- Course Overview next assessment summary derives from the same real Assessment/Milestone data; avoid duplicate mutable countdowns or fake event IDs. `Continue` and `Resume` resolve stable item ID after refresh, and missing IDs fall back safely.

## 8. Shared Timeline/Calendar/Tasks/Timer integration

- One canonical `CourseAssessment`, with individually identified `ExamMilestone` projections. A verified exam date maps to one Calendar item; registration close/withdraw deadlines map to distinct events, with distinct `canonicalSourceId` per milestone and stable deduplication.
- Reuse `GlobalCalendarService`; specify `sourceType` distinctions for exam vs registration milestone as needed and preserve existing `assessment-deadline` semantics for Module 007 legacy records. A prior 007 projection should be replaced or derived—not added as a second event—for the same exam.
- `date-only` → date-only Calendar entry (no fabricated start/end/time); exact → proper timezone handling; unknown/unverified must not masquerade as confirmed.
- The current Calendar service defaults to a project scope. This module's mandatory integration is the verified **course-offering-scoped Calendar query** and existing shared presentation. A genuinely all-offerings / all-areas aggregate Calendar requires a separately frozen cross-project query contract; do not claim it is already present.
- User may create an Exam Preparation or Registration Task via `GlobalTaskService`, with deterministic idempotency and explicit relation to the Assessment; a Task's due date and planned sessions never overwrite official exam/registration milestones.
- Global Timer and TimeEntry always record actual elapsed time only through the existing controls. A manually entered practice duration stays self-reported and is never automatically added to actual study time.
- No automation to register exams, issue push alerts, calculate study schedules or watch university changes.

## 9. Storage, migration and lifecycle

- Current canonical repository `study-courses` schema v2; propose safe **v2→v3** extension of the same repository, with explicit versioned backup *before mutation*. Preserve v1→v2 migration path and test **v1→v3 and v2→v3** without loss.
- Legacy `CourseAssessment` IDs, fields, `verified` behavior and existing 007 Calendar events survive; 008 Units, Sets, Items, Attempts, Resource/Task evidence and TimeEntry retain exact IDs.
- No new parallel authoritative Exam DB, Task DB, Resource DB, Exercise DB or ad-hoc localStorage.
- Mutations are serialized and validate `offeringId/courseId/assessmentId/paperId` foreign keys and cross-term link permissions. Deletion is archive/cancel by default; a real sitting, practice or result history is never destroyed by file re-scan or disappearance.
- A source ZIP/folder re-scan cannot invent new Exam deadlines or delete existing paper records; manually added metadata and paper Resource IDs persist.
- Across canonical domains (Task/Resource/Study), failed partial relation writes must report truthful commit state and provide idempotent retry/reconciliation; never claim cross-store atomicity without proof.
- Unsupported schema versions fail safely, last committed data and backups remain recoverable.

## 10. Proposed 30-row frozen acceptance matrix (DRAFT — NOT ACCEPTED YET)

1. Exams route opens correct `CourseOffering`; cross-semester assessment/sitting data does not leak.
2. 007 existing Assessment IDs/data survive; Exams tab is functional only after real implementation.
3. Create/edit/archive real Assessment has stable ID and validated type/offering ownership.
4. Past Paper metadata is **not** a real Assessment and importing a Past Paper never invents an exam date.
5. Unverified/unknown exam dates clearly display Unknown/Tentative, not official confirmed.
6. Date-only confirmed exam events display date without fabricated time/00:00.
7. Exact exam date preserves local time, IANA timezone and DST conversion.
8. A corrected date retains provenance/history and stops displaying superseded milestone as upcoming.
9. Cancelled real exam preserves history and is excluded from current upcoming projections.
10. Registration open/close, withdrawal close and actual exam time are separate milestones and never overwrite each other.
11. Registration status only changes after explicit user action; no third-party university-system claim.
12. An unknown registration status is not silently converted to Registered/Not registered.
13. An actual ExamSitting is separately recorded, can include absence/withdrawal, and is never created by passing time.
14. Official/self-reported result sources remain distinct; numeric grade does not auto-infer PASS/FAIL.
15. Multiple attempts/historical sittings across offerings remain distinct and recoverable.
16. Past Paper catalog references **one canonical Global Resource** and offers optional solution linkage without copying bytes.
17. Same Past Paper explicitly reused across offerings preserves paper identity but never copies progress/Task/TimeEntry.
18. Missing/other-device paper file availability retains paper and practice history; Open Original capability-gated.
19. Practice status/score is explicitly entered; missing max points shows Unknown, not fake completion/percentage.
20. Practice score and actual official exam result never mix or update each other.
21. Optional per-question practice uses canonical Module 008 Sets/Items/Attempts; repeated mapping avoids duplicate Items.
22. Past Paper source import/open/solution view does not mark questions solved or a Unit mastered.
23. Canonical Task created from an Exam/Milestone is idempotent and appears as one Task, with failure/retry reconciliation.
24. Task dueDate, Calendar PlannedSession, registration milestone and exam date remain separate canonical facts.
25. Calendar shows one stable exam event and distinct registration/withdraw milestones with truthful date precision; no duplicate 007 projection.
26. Global Timer/TimeEntry actual seconds unchanged by self-reported mock duration; no auto Timer start.
27. Exam/Practice/Resource Resume links resolve stable IDs and safe fallbacks after archive/deletion.
28. v1→v3 and v2→v3 migration preserve legacy 007 verified assessments/resource marks and 008 state, with backup and failed-migration safety.
29. Real browser 1440/1024/390 no overflow; shared Inspector Escape and create-focus restoration, keyboard/ARIA, unknown/error/permission states.
30. Existing 001–008 regressions plus Typecheck, Lint, Build, Tests, git diff check pass; independent Review Only QA reports actual 30-row results and exact SHA.

## 11. Primary design risks and decisions needed before freezing

**D1 — Past Paper metadata ownership:** Recommendation: course-wide catalog + explicit per-offering links, while practice and exam sittings are always offering-scoped. This enables using past WS/SS papers across new exam terms without accidentally sharing solved progress.

**D2 — Exam date / registration Calendar policy:** Recommendation: confirmed date-only milestones appear as all-day entries with honest precision; unverified tentative dates stay visible in Exams but not deceptively labeled official. Record source-verified vs user-confirmed vs legacy-verified separately.

**D3 — Practice depth:** Recommendation: V1 manually records one paper-level practice session/score, with optional deliberate link to Module 008 per-question tracking. PDF auto-extraction, answer checking and exam prediction are excluded.

**D4 — Unified Calendar boundary:** Recommendation: keep existing canonical Calendar source and offering-scoped projections; treat a full cross-domain all-areas aggregated calendar as a separate explicit contract decision, not a hidden part of 009.

**D5 — Personal results/history:** Recommendation: preserve explicit real sitting outcomes and grades separately from self-rated practice; no grade-threshold pass/fail inference.

**D6 — OSS reuse gate:** Before coding, run an up-to-date three-candidate GitHub review across **stars, latest commit, license, technology stack and deployment/adaptation cost**, with precise links and reuse/security risks; no external framework/dependency install from this draft alone.

## 12. Stage sequencing / handoff contract

1. **Current state: DESIGN DRAFT / REVIEW OPEN.** User and Design Window review D1–D6, adjust scope and acceptance matrix.
2. If user explicitly accepts the product design, Design Window publishes `docs/handoffs/009/DESIGN_APPROVED.md` as a **distinct frozen artifact**. Approval of a design is **not** authorization to write code.
3. Separately inspect the actual latest accepted `main` types, migration, Resources/Task/Calendar/Resume/Inspector contracts; do the mandatory three-project OSS reuse check; author `EXECUTION_INSTRUCTION.md` and a **separate Module 009 implementation start authority** only after the user approves the release.
4. Development works only on new, isolated Module 009 branch, with exact SHA and testing evidence. Independent Review Only QA tests the frozen matrix. Design Window alone issues remediation/acceptance/merge authorization.
5. No Module 010, B2B/B3, scheduler, always-on agent or Codex Queue implicitly starts by advancing Module 009 design.

**Current binding decision:** REVIEW THE DRAFT, NOT IMPLEMENT IT. No source code changes, no QA status, no hidden acceptance.
