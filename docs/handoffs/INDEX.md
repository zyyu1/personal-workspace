# Personal Workspace Handoff Index

Current module gate summary (2026-11-22). This index is a pointer; each module's `STATUS.md`, QA evidence and Design Window decisions remain authoritative. The historical transitions are preserved inside those documents.

| Module ID | Module Name | Design Status | Implementation Status | QA Status | Accepted Code / Merge Anchor | Current Handoff Path |
| --- | --- | --- | --- | --- | --- | --- |
| 007 | Study Workspace — Course Overview V1.0 | APPROVED / FROZEN | **MERGED / FINAL ACCEPTED**, PR #15; Issue #16 CLOSED | 24 PASS / 0 PARTIAL / 0 FAIL (including final Windows host acceptance) | Accepted code `1c35753804e6b99f2dc620756e4a8dce70f7292c`; merge `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08` | [`docs/handoffs/007/`](./007/) |
| 008 | Study Workspace — Course Learning Progress & Exercises V1.0 | APPROVED / FROZEN | **MERGED / FINAL CODE ACCEPTED**, PR #18; Issue #17 CLOSED | 30 PASS / 0 PARTIAL / 0 FAIL (Revision 01 independent QA; original rejection preserved) | Accepted code `d366710e51f5f4ab1cb6a10cb2919c46549afaed`; merge `48558a862b299b030fbd680aa9677115c92ca773` | [`docs/handoffs/008/`](./008/) |
| 009 | Study Workspace — Exams & Past Papers V1.0 | **APPROVED / DESIGN FROZEN** (2026-11-22) | **NOT AUTHORIZED / NOT STARTED** | NOT STARTED — 30 frozen acceptance requirements, NOT QA results | Approved frozen design: [`009/DESIGN_APPROVED.md`](./009/DESIGN_APPROVED.md); no 009 code anchor | [`docs/handoffs/009/`](./009/) |

**Design vs execution boundary:** Module 009's [user-approved frozen design](./009/DESIGN_APPROVED.md) and [current status](./009/STATUS.md) do **not** authorize code; the [original draft](./009/DESIGN_DRAFT.md) remains preserved. A separate implementation authorization, branch/PR, independent Review Only QA and later Design Window merge decision remain mandatory. Module 010 / B2B / B3 / real Codex Queue retain their prior restrictive gates.
