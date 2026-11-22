# Module 009 Status — Design Approved / Code Start Authorized

- **Module:** 009
- **Name:** Study Workspace — Exams & Past Papers V1.0
- **Design state:** **APPROVED / DESIGN FROZEN** — user approved the V1.0 scope and D1–D6 design decisions on **2026-11-22 (Europe/Berlin)**.
- **Authoritative frozen design:** [`DESIGN_APPROVED.md`](./DESIGN_APPROVED.md) — frozen product scope, entity ownership, UI/UX, date precision/provenance, registration and real sitting/history contracts, per-offering practice, v2→v3 migration plan, and **30 frozen future acceptance requirements**.
- **Historical review draft:** [`DESIGN_DRAFT.md`](./DESIGN_DRAFT.md) remains intact as the previous design-review artifact. Its `NOT APPROVED` status reflects the earlier stage only, not the current design gate.
- **Implementation:** **START AUTHORIZED FOR CODE ONLY / NOT YET EXECUTED / PR NOT OPEN / MERGE HOLD**. Distinct [`MODULE_009_START_AUTHORIZATION.md`](./MODULE_009_START_AUTHORIZATION.md) and [`EXECUTION_INSTRUCTION.md`](./EXECUTION_INSTRUCTION.md) now published; [Issue #19](https://github.com/zyyu1/personal-workspace/issues/19) OPEN. Publishing the authority has **not** modified source, created a code branch/PR, started Claude/Codex or authorized any merge.
- **Independent QA:** **NOT STARTED**. The frozen 30-row acceptance matrix is a future validation requirement, **not** an assertion that 30 tests or QA checks passed.
- **Prerequisites for design:** Module 008 [PR #18](https://github.com/zyyu1/personal-workspace/pull/18) MERGED at `48558a862b299b030fbd680aa9677115c92ca773`, accepted candidate `d366710e51f5f4ab1cb6a10cb2919c46549afaed`, independent QA **30 PASS / 0 PARTIAL / 0 FAIL**; Issue #17 CLOSED. Module 007 previously fully accepted.
- **Source interface review:** actual accepted `main` contracts audited in [`CURRENT_MAIN_INTERFACE_AND_MIGRATION_AUDIT.md`](./CURRENT_MAIN_INTERFACE_AND_MIGRATION_AUDIT.md) against source code anchor `1a77022f0b1af013e137ec01cd3942e7028e3c0b`; **compatibility conditional PASS** for bounded implementation, including safe `v1/v2→v3`. Development must reverify **latest main** before coding.
- **Approved design decisions:** D1 Course-wide Past Paper with explicit offering-scoped practice; D2 explicit date precision, verified source and distinct registration milestones; D3 manually recorded paper-level practice with optional 008 per-question mapping; D4 existing offering-scoped Calendar reuse, no implicit full cross-domain rewrite; D5 real sitting and official/self-reported outcomes separated from practice; D6 mandatory **three-project current GitHub OSS evaluation** before implementation.
- **OSS and execution release:** Three verified candidates and five-factor analysis recorded in [`OSS_REUSE_REVIEW.md`](./OSS_REUSE_REVIEW.md); preferred conditional `@js-temporal/polyfill`, at most one timezone dependency after verification. **Separate code-only start approval granted** in [`MODULE_009_START_AUTHORIZATION.md`](./MODULE_009_START_AUTHORIZATION.md), to a user-initiated interactive Claude Code window after clean-main preflight. **Next gate: developer PR + QA handoff → independent Review Only QA**. No merge authority.
- **Other modules/automation:** Module 010 NOT AUTHORIZED; B2B paused; B3, background watcher/service/scheduler, unattended cloud agent or real Codex Queue NOT AUTHORIZED. Interactive Claude Code for **Module 009 repository coding only** is now explicitly permitted, not auto-launched.

## Design review chronology

1. 2026-11-22 — Module 009 `DESIGN_DRAFT.md` published as **DRAFT / NOT APPROVED**; prototype code work explicitly held.
2. 2026-11-22 — User explicitly approved Module 009 product design; Design Window froze `DESIGN_APPROVED.md` in commit `e27cc9d5660e57807063fa11a41eb00e9451e1de`, preserving the original draft.
3. 2026-11-22 — Design Window completed accepted-main technical audit and three-candidate GitHub OSS due diligence; published `EXECUTION_INSTRUCTION.md` and the **independent** `MODULE_009_START_AUTHORIZATION.md`; opened work [Issue #19](https://github.com/zyyu1/personal-workspace/issues/19).
4. **Current gate:** **DESIGN APPROVED / FROZEN; CODE START AUTHORIZED / NOT EXECUTED; QA NOT STARTED; MERGE HOLD.**

## Scoped CI permission addendum — 2026-11-22

- **User decision:** **APPROVED** a narrowly scoped GitHub Actions CI configuration/execution permission for the interactive Module 009 development window. [Formal CI approval](./MODULE_009_CI_PERMISSION_APPROVAL.md) on main commit `34d9b5e78701daa52d1d05aea82318e996b74e4f`.
- **CI scope:** one read-only checkout workflow for the Module 009 PR, Typecheck/Lint/Build/Tests/Diff; restrict trigger/job to `codex/module-009`, read-only token, no secrets, no deployment, no repository-settings/branch-protection edits.
- **Factual implementation status at approval:** GitHub main showed no CI workflow file and Issue #19 contained no detailed CI request comment; this is a controlled *permission to implement CI*, **not** evidence that a workflow is installed, that a GitHub scope was granted, or that CI has passed.
- **Unchanged gates:** Module 009 code is separately authorized but actual implementation/CI proof pending. Independent Review Only QA and a later separate Design Window merger approval remain mandatory. No Module 010, B2B/B3, scheduler, Codex Queue or unattended automation.

## Module 009 Cloud Preflight Run 01 — Design Window Disposition (2026-11-22)

- **Source evidence:** [`MODULE_009_PREFLIGHT_RUN01.tex`](https://github.com/zyyu1/personal-workspace/blob/2746f9493996225929fc33763f090bc3e825c73f/docs/handoffs/009/reports/MODULE_009_PREFLIGHT_RUN01.tex) on the separate `module-009-run-reports` branch, report commit `2746f9493996225929fc33763f090bc3e825c73f` (**not main; evidence only**).
- **Run 01 result:** Repository/interface preflight reported PASS, but the Cloud Claude session lacked `node_modules`, npm registry resolution failed `ENOTFOUND` and offline cache install failed `ENOTCACHED`. Typecheck/Lint/Build/Test and real-browser checks were **BLOCKED / NOT RUN**, not source-code FAIL.
- **Formal decision:** [Design Window Run 01 disposition](./MODULE_009_PREFLIGHT_RUN01_DISPOSITION.md), commit `f01d87381923de695c20b33612e81aaf85d505f5`: **ACCEPT STOP / OPTION 1 APPROVED — SWITCH TO USER-INITIATED LOCAL WINDOWS CLAUDE CODE RUN 02; NEW ENVIRONMENT PREFLIGHT REQUIRED**. The failed cloud session remains STOPPED; no new cloud network/Windows access is implicitly granted.
- **Current main advanced since Run01:** `1101415` → `b6140bd` via two **documentation-only** CI approval commits; Run02 must freshly verify latest `main` and fully read frozen `DESIGN_APPROVED.md` including all 30 rows (Run01 only read its outline).
- **CI:** Earlier Run01 report's 'CI request pending' statement is superseded: **scoped CI approved** by user and Design Window under `MODULE_009_CI_PERMISSION_APPROVAL.md`; no actual workflow or CI PASS is implied.
- **Unchanged product gate:** Module 009 **DESIGN APPROVED / CODE START AUTHORIZED CONDITIONAL ON RUN02 PRECHECK / IMPLEMENTATION NOT STARTED / INDEPENDENT QA NOT STARTED / MERGE HOLD**. Issue #19 stays OPEN. No Module 010/B2B/B3/real Codex Queue/background operation.
