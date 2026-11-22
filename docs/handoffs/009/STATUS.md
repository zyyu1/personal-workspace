# Module 009 Status — Design Review Only

- **Module:** 009
- **Proposed name:** Study Workspace — Exams & Past Papers V1.0
- **Design state:** **DRAFT / INDEPENDENT DESIGN REVIEW OPEN / NOT APPROVED / NOT FROZEN** (2026-11-22).
- **Design draft:** [DESIGN_DRAFT.md](./DESIGN_DRAFT.md); the source-of-truth draft includes product goals, canonical data boundaries, user flows, date/registration precision, past-paper practice, migration risks, 30 **proposed** QA rows and D1–D6 decision points.
- **Implementation:** **NOT AUTHORIZED / NOT STARTED**. No Module 009 code branch, implementation PR, QA handoff or development work order is authorized by this file.
- **QA:** **NOT STARTED / NO IMPLEMENTATION TO REVIEW**. Proposed 30-row acceptance matrix is a draft; it is not a completed QA score.
- **Prerequisite:** **FULFILLED for design review only** — Module 008 [PR #18](https://github.com/zyyu1/personal-workspace/pull/18) MERGED at `48558a862b299b030fbd680aa9677115c92ca773`, accepted candidate `d366710e51f5f4ab1cb6a10cb2919c46549afaed`, independent QA 30/30 PASS; [Issue #17](https://github.com/zyyu1/personal-workspace/issues/17) CLOSED; latest final 008 STATUS update `07dd45933afb76df4a128dca08cabcde5721099a`.
- **Source interface review:** Actual `study-courses` v2, `CourseAssessment`, `StudyTabs`, `StudyCourseService`, `GlobalCalendarService`, `CourseExerciseSet/Item/Attempt`, Resources, Tasks, Timer/TimeEntry and Resume inspected before opening design review.
- **Current decision:** Design window may discuss/refine Module 009 product model. **No frozen `DESIGN_APPROVED.md`, no `EXECUTION_INSTRUCTION.md`, no start authorization**. A user-approved design and a later independent code-start release are separate gates.
- **Design choices under review:** (D1) course-wide Past Papers + offering-scoped practice, (D2) precise dates, evidence and registration milestones, (D3) practice summary + optional 008 question mapping, (D4) project-scoped existing shared Calendar instead of covert global rewrite, (D5) official sittings/results separated from practice, (D6) three-project OSS due diligence before implementation.
- **Next action:** User reviews Module 009 design choices and draft 30-row matrix; Design Window revises as needed. Only after explicit design approval may `DESIGN_APPROVED.md` be published. Code remains on HOLD until **separate, explicit implementation authorization**.
- **Other modules/automation:** Module 010 NOT AUTHORIZED; B2B paused; B3, background watcher/service/scheduler and real Codex Queue NOT AUTHORIZED.

This document records **entry into design review**, not acceptance of the draft. Existing Module 007/008 histories remain unchanged.
