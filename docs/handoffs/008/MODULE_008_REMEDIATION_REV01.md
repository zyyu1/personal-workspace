# Personal Workspace — Module 008 Targeted Remediation Revision 01

**Design Window decision (2026-11-21, Europe/Berlin):** **QA REJECTED / TARGETED REMEDIATION AUTHORIZED / MERGE HOLD**.
**Scope:** Module 008 V1.0 defects found by independent Review Only QA on PR #18. **This is not final QA acceptance or merge approval.**
**Frozen design:** `docs/handoffs/008/DESIGN_APPROVED.md` and `docs/handoffs/008/MODULE_008_START_AUTHORIZATION.md` remain unchanged.
**Work order:** [Issue #17](https://github.com/zyyu1/personal-workspace/issues/17).
**Implementation PR:** [#18](https://github.com/zyyu1/personal-workspace/pull/18) — OPEN / UNMERGED.
**Exact rejected QA candidate HEAD:** `e31502bb346b38c0a559519f97b829da22c963ae`; base `5e2849ec4e4ba0147ab8ab5051d442717171ec19`; original implementation commit `f5c5b003fe979eb5d253f075f660c771ee2c928a`.
**Independent QA evidence:** [PR #18 QA REJECTED](https://github.com/zyyu1/personal-workspace/pull/18#issuecomment-7069366299), **26 PASS / 1 PARTIAL / 3 FAIL** in the frozen 30-row matrix. These are independent results; the developer's 30/30 self-check is not an acceptance.

## 1. Authorization boundary and preflight

The existing interactive Windows Development Window may correct **only** the five issues listed below on the **existing** `codex/module-008` branch and PR #18. Before edits, verify actual current branch, exact HEAD, `git status --short`, accepted Module 007 merge ancestry, the frozen Module 008 requirements, and this instruction. If local uncommitted changes, branch divergence, an unexpected newer candidate, or a material contract/data-loss conflict exists, **STOP and report to Design Window**; do not reset, clean, force-push, or overwrite unreviewed work. No rewrite of accepted 007 behavior.

The GitHub instruction is a human-facing authorization only. It does **not** dispatch to or wake a Windows/Codex session and does not permit background automation.

## 2. Required targeted corrections

### M008-QA-001 — HIGH: partial-update data loss (matrix #3 FAIL)

Current `studyLearningService.ts` `updateUnit`, `updateSet`, and `updateItem` turn omitted optional patch properties into `undefined` (e.g. `code`, `description`, `setCode`, `title`, `sourcePointer`) and erase unrelated saved user content. Fix patch semantics so:
- Omitted properties preserve prior values exactly; **explicit** empty strings may clear optional text fields, with deliberate validation for required fields.
- Changes to coverage, ordering/parent, state or one metadata field do not erase the rest; stable IDs and timestamps are handled correctly.
- Audit other **Module 008 partial-patch paths of the same defect class**, including `reviseAttempt` optional `notes` if it has the same omitted-field behavior. Stay inside this defect family; do not refactor unrelated services.
- Add deterministic unit/service/UI regressions showing saved metadata survives partial updates and IndexedDB reload; test an explicitly requested optional-field clear separately. A real browser reproduction of the original Unit-code loss should now PASS.

### M008-QA-002 — MEDIUM: concurrent duplicate canonical Tasks (matrix #23 FAIL)

`createTask` checks `evidenceLinks` outside a safe idempotency boundary, then creates a Global Task, allowing concurrent calls to allocate duplicate Task IDs.
- Provide a minimal, trustworthy **same-offering / same-target idempotency mechanism**; concurrent/retried calls to Create/Open Task for one target resolve to **one canonical Global Task ID and one association**. Do not create a second task database or duplicate Task IDs.
- Preserve Task ownership, cross-view synchronization, and the existing shared `GlobalTaskService`. Handle the non-atomic Study/GlobalTask boundary explicitly: if partial failure occurs, report truthful persisted state and support safe reconciliation without silently orphaning or duplicating tasks.
- Add `Promise.all` concurrent invocation tests, plus retry and injected partial-failure/recovery cases; assert canonical Task and relation counts and correct Tasks/Calendar behavior. Sequential-only testing is insufficient.

### M008-QA-003 — MEDIUM: incomplete 007 Overview projection (matrix #21 PARTIAL)

The Overview Learning Progress card currently only renders eligible Unit study coverage.
- Render from **one existing derived `CourseProgressQuery`**, with **studied units x/y**, **solved exercises a/b**, and **review queue count n**.
- When either denominator is absent, show **Not configured / no tracked items** rather than a fabricated `0%` or hiding the other dimension. Do not conflate file/resource marks with Unit mastery; do not store mutable duplicate counters.
- Add UI regression for an explicitly solved exercise flagged for review with no eligible Unit leaves; verify the Overview still shows the exercise and review summary. Cover refresh after mutation.

### M008-QA-004 — MEDIUM: create → auto-open Inspector loses focus (matrix #29 FAIL)

On 390px mobile, creating a new Unit or Exercise Item auto-opens the Inspector; Escape currently sends focus to `document.body`.
- Capture a real, stable return-focus target for **Add Unit** and **Add Item** creation flows (initiating control or newly created row). Feed it through the existing shared `InspectorShell` mechanism.
- Preserve valid existing-row selection, keyboard Escape, deep link and tablet/desktop behavior; do not build a second modal/Inspector.
- Add automated create → auto-open → Escape → focus-restored tests for both Unit and Exercise Item. Recheck 390×844 / 1024×768 / 1440×900 in a real browser, including no horizontal overflow.

### M008-QA-005 — LOW: stale candidate identity in QA handoff

- After final remediation commits, update PR #18 body, `docs/handoffs/008/QA_HANDOFF.md`, and branch `docs/handoffs/008/STATUS.md` (where applicable) with **the exact actual candidate HEAD** and implementation/revision commit relationship; avoid self-referential HEAD claims that are invalidated by a subsequent documentation commit.
- Attach truthful commands/results, expected residual warnings, browser evidence, and an **updated complete 30-row QA matrix self-check**. Preserve the original REJECTED QA and the audit trail, not a retroactive PASS.
- Do not change the frozen design; resolve branch-specific `STATUS.md` audit history against `main` carefully at the eventual merge gate. No silent overwrite.

## 3. Mandatory regression and handoff

Run and report on the **final exact candidate HEAD**:
```bash
npm run typecheck
npm run lint
npm run build
npm test -- --run
git diff --check
```
Report exact test counts, warnings and any failed/partial rows; inspect Module 007 migration/data preservation, cross-semester offering isolation, canonical Resource/Task/Calendar/Timer/Resume behavior, and 1440/1024/390 accessibility. Explicitly retest rows **#3, #21, #23, #29** and metadata integrity, concurrency/idempotence, UI summary and focus; no prior QA result can be transported to a modified HEAD.

Submit a scoped new commit on existing PR #18, updated `QA_HANDOFF.md` with exact SHA, and a fresh independent **Review Only** QA report anchored to the final HEAD. Independent QA must check the full frozen 30-row matrix as well as the five remedies; it may find additional regressions. The developer must **STOP after QA handoff** and await a fresh Design Window decision. Do not merge/close PR #18 or Issue #17 merely because the automated tests pass.

## 4. Strict exclusions / final gates

- **Merge remains HOLD** until independent QA is satisfactory **and** Design Window issues a new, explicit merge authorization.
- **No Module 009/010**, no B2B (user-paused), no B3, no live `codex queue`, no scheduler/background watcher/daemon/service, and no new backend/cloud sync, FSRS, AI grading or automatic lesson/solve inference.
- No destructive migrations, changes to legacy Module 007 resource-level progress semantics, unauthorized original-file writes, or Scope Expansion. Any material data or contract incompatibility requires STOP and a separate design decision.
- This Revision 01 is **authorization for defect remediation only**, not authorization to auto-run on Windows. The user must choose to deliver the instruction to the interactive Windows Development Window.

## 5. Status-record handling

The `main` branch's earlier `docs/handoffs/008/STATUS.md` reflects the historical start authorization and is not the latest execution/QA report. PR #18, Issue #17, this document, and independent QA comments establish the current factual state: **IMPLEMENTED CANDIDATE / INDEPENDENT QA REJECTED / REMEDIATION REV01 AUTHORIZED / PR UNMERGED / MERGE HOLD**.

To avoid repeating Module 007's `STATUS.md` merge conflict, this design decision is recorded as an **additive new file plus Issue/PR comments**, not a concurrent rewrite of `main`'s `008/STATUS.md` while PR #18 also changes that path. Preserve and reconcile the chronological status audit before final merge.
