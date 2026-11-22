# Personal Workspace — Module 009 Explicit Development Start Authorization

**Design Window v0.0.2 formal decision (2026-11-22, Europe/Berlin): START AUTHORIZED FOR MODULE 009 CODE ONLY / INDEPENDENT QA REQUIRED / MERGE HOLD.**

**This is a NEW, independent Module 009 implementation authority**, based on the user's explicit request to audit interfaces, evaluate three GitHub OSS candidates, publish execution instructions and issue a distinct development authorization. It does **not** rely on the concluded one-time Module 008 Claude cloud merge handoff, and it does not start any execution automatically.

## 1. Gate evidence and immutable design

- Module 007: FINAL ACCEPTED, merge `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`; independent host QA completed.
- Module 008: FINAL ACCEPTED, merge `48558a862b299b030fbd680aa9677115c92ca773`, accepted code `d366710e51f5f4ab1cb6a10cb2919c46549afaed`, independent QA **30 PASS / 0 PARTIAL / 0 FAIL**, Issue #17 CLOSED.
- [Module 009 frozen approved design](./DESIGN_APPROVED.md), approved by user 2026-11-22, including **all 30 immutable acceptance rows** and approved D1–D6.
- [Latest-main interface and migration audit](./CURRENT_MAIN_INTERFACE_AND_MIGRATION_AUDIT.md): compatibility conditional PASS at actual code baseline `1a77022f0b1af013e137ec01cd3942e7028e3c0b`; mandatory v1/v2→v3, Calendar, Task, Resource, Resume guards identified. Audit is **not implementation QA**.
- [Three-project OSS assessment](./OSS_REUSE_REVIEW.md): Luxon (MIT), `@date-fns/tz` (MIT, in date-fns monorepo), `@js-temporal/polyfill` (ISC); stars, latest commits, stacks, licensing and adaptation cost checked 2026-11-22. **At most one** verified timezone library may be installed if needed, preferred `@js-temporal/polyfill`, after exact version, lockfile, compatibility and bundle checks. No other new date/calendar framework authorized.
- **Complete binding implementation plan:** [`EXECUTION_INSTRUCTION.md`](./EXECUTION_INSTRUCTION.md).
- Real GitHub work issue for this Module 009 release must be created and verified before coding. Its URL should be linked into this document once issued; the absence of the issue is a **preflight STOP**.

## 2. Execution operator / environment

**Authorized operator:** **user-initiated, interactive Claude Code Development / Execution Window**, either a clearly identified local Windows workspace or a clean GitHub-connected Claude Code cloud clone **for repository code work only**. The user's previous cloud grant for Module 008 was scoped to that merge and is not silently reused; this document is the separate explicit permission for **Module 009 repo coding**.

- A cloud operator must be truthful about **not** having access to the user's Windows folders, native folder picker, USB devices, local app data or system GUI. No remote Windows tool permission, native host app execution or hidden external-account access is granted.
- The operator must verify current `main`, correct repository and clean worktree before any modification. This publication itself does not dispatch a command to any operating system or active assistant session.
- Developer may create a branch `codex/module-009` from latest clean `main` (repository historical naming, regardless of Claude executor); create a PR for review. If branch already exists unexpectedly or local worktree is dirty, STOP instead of reset/rebase/overwrite.
- QA executor remains **separate** from developer. The Design Window never self-certifies code by publishing docs.

## 3. Precisely authorized coding and evidence

**Permitted feature:** frozen `Exams & Past Papers V1.0` only: canonical Assessment/registration/milestones/sittings, course-wide referenced Past Papers with explicit offering practice, manual paper-level practice and optional 008 question links; offering-scoped Calendar/Task/Timer/Resume integration, Course Overview projection, Exams route/Inspector UI, safe schema v3 migration.

**Permitted supporting edits:** only necessary typed and tested changes in actual Study/GlobalResource/GlobalTask (if truly required)/GlobalCalendar/Resume/Inspector/App surfaces, Module 009 tests and handoff/docs; no unbounded refactor, no new canonical store or changed frozen design.

**Mandatory QA gates before submitting PR:** `npm run typecheck`, `npm run lint`, `npm run build`, `npm test -- --run`, `git diff --check`, migration backups and failure-injection proof, concurrency/idempotency, truthful Calendar date and DST scenarios, 001–008 regression, actual browser 1440×900/1024×768/390×844. Report actual exit codes and pre-existing warning count, exact HEAD, dependency delta, each of **30 frozen rows** with developer evidence.

**Required handoff:** one Module 009 implementation PR opened toward `main` with exact HEAD published after final code+doc commits, `docs/handoffs/009/QA_HANDOFF.md` and branch-local truthful STATUS, then STOP for independent **Review Only** QA. Independent QA returns ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE; Design Window separately decides remediation and merge. This authorization **does not permit merging**.

## 4. STOP and exclusions

- STOP on unexpected source changes vs audit, missing current GitHub authorization/work issue, uncertain migration data preservation, wrong offering/source identity, invalid date/time semantics, DST coercion, nondeterministic duplicate entities or partial commit uncertainty, failed tests, unreconciled dependency/security mismatch, or inability to check live branch/HEAD.
- No force push, `git reset --hard`, destructive cleanup, hidden local files or uncontrolled branch rebases. Ask Design Window for a scoped remediation instruction rather than broaden the implementation.
- **No Module 010**, B2B (paused), B3, real Codex Queue, auto watcher/daemon/scheduler, AI grading, OCR auto question extraction, university registration automation, cloud synchronization or new backend.

## 5. Release boundary and next action

The user has authorized publication of the execution instruction and a **separate Module 009 development start authority**. **START AUTHORIZED FOR CODE ONLY** once the work issue exists and all local preflight gates pass. The user must explicitly relay the instruction into a Claude Code window to begin interactive execution. Publishing a GitHub issue/document **does not automatically launch an agent**.

**Do not merge PR, close work issue, publish QA PASS, or start another module without future explicit Design Window decisions.**

**Current factual Module 009 state at publication:** DESIGN APPROVED/FROZEN; execution plan audited and authorized; **SOURCE NOT IMPLEMENTED / QA NOT STARTED / MERGE NOT AUTHORIZED**.
