# Module 009 Status — Design Approved / Implementation Hold

- **Module:** 009
- **Name:** Study Workspace — Exams & Past Papers V1.0
- **Design state:** **APPROVED / DESIGN FROZEN** — user approved the V1.0 scope and D1–D6 design decisions on **2026-11-22 (Europe/Berlin)**.
- **Authoritative frozen design:** [`DESIGN_APPROVED.md`](./DESIGN_APPROVED.md) — frozen product scope, entity ownership, UI/UX, date precision/provenance, registration and real sitting/history contracts, per-offering practice, v2→v3 migration plan, and **30 frozen future acceptance requirements**.
- **Historical review draft:** [`DESIGN_DRAFT.md`](./DESIGN_DRAFT.md) remains intact as the previous design-review artifact. Its `NOT APPROVED` status reflects the earlier stage only, not the current design gate.
- **Implementation:** **NOT AUTHORIZED / NOT STARTED / HOLD**. No `EXECUTION_INSTRUCTION.md`, no separate 009 start authorization, no development branch or PR has been approved by this design freeze. No code or schema changes occurred in this Design Window.
- **Independent QA:** **NOT STARTED**. The frozen 30-row acceptance matrix is a future validation requirement, **not** an assertion that 30 tests or QA checks passed.
- **Prerequisites for design:** Module 008 [PR #18](https://github.com/zyyu1/personal-workspace/pull/18) MERGED at `48558a862b299b030fbd680aa9677115c92ca773`, accepted candidate `d366710e51f5f4ab1cb6a10cb2919c46549afaed`, independent QA **30 PASS / 0 PARTIAL / 0 FAIL**; Issue #17 CLOSED. Module 007 previously fully accepted.
- **Source interface review:** actual `study-courses` v2, `CourseAssessment`, `StudyTabs`, `StudyCourseService`, `GlobalCalendarService`, `CourseExerciseSet/Item/Attempt`, canonical Resources/Tasks/Timer/TimeEntry/Resume inspected at design review. These must be **reverified on latest main** before code start.
- **Approved design decisions:** D1 Course-wide Past Paper with explicit offering-scoped practice; D2 explicit date precision, verified source and distinct registration milestones; D3 manually recorded paper-level practice with optional 008 per-question mapping; D4 existing offering-scoped Calendar reuse, no implicit full cross-domain rewrite; D5 real sitting and official/self-reported outcomes separated from practice; D6 mandatory **three-project current GitHub OSS evaluation** before implementation.
- **Next gate:** Design Window must complete current-main contract compatibility check and GitHub OSS evaluation, then present and obtain a **distinct explicit implementation authorization**. Approval of this design does not imply auto-release of source coding.
- **Other modules/automation:** Module 010 NOT AUTHORIZED; B2B paused; B3, background watcher/service/scheduler, cloud agent or real Codex Queue NOT AUTHORIZED.

## Design review chronology

1. 2026-11-22 — Module 009 `DESIGN_DRAFT.md` published as **DRAFT / NOT APPROVED**; prototype code work explicitly held.
2. 2026-11-22 — User explicitly approved Module 009 product design; Design Window froze `DESIGN_APPROVED.md` in commit `e27cc9d5660e57807063fa11a41eb00e9451e1de`, preserving the original draft.
3. **Current gate:** **DESIGN APPROVED / FROZEN; IMPLEMENTATION AND QA NOT STARTED.**
