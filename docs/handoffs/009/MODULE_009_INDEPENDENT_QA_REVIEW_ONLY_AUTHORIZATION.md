# Personal Workspace — Module 009 Independent Review Only QA Authorization

**Design Window v0.0.2 · 2026-11-22 (Europe/Berlin)**  
**Decision:** **DEVELOPMENT CANDIDATE RECEIVED / EXACT-HEAD CI VERIFIED / INDEPENDENT REVIEW ONLY QA AUTHORIZED / 30-ROW FROZEN MATRIX / MERGE HOLD.**  
**Work Issue:** [#19](https://github.com/zyyu1/personal-workspace/issues/19), OPEN.  
**Candidate:** [Draft PR #20](https://github.com/zyyu1/personal-workspace/pull/20), `codex/module-009`.  
**Sole candidate review anchor:** `a042be2304bee7ef56678d719ea3a09999a95cce` (verify live HEAD before commencing).  
**Latest script change:** `a042be2`, parent `b9fd7637ab66ef1e37afc43fb1968e0b8e26670c`; **only** `tools/ci/module-009-browser-smoke.mjs` changed, not application source, workflow, lockfile or dependency manifest.  
**Authoritative design:** [DESIGN_APPROVED.md](./DESIGN_APPROVED.md), D1–D6, 30 numbered acceptance requirements.  
**Full developer handoff:** [QA_HANDOFF.md](https://github.com/zyyu1/personal-workspace/blob/a042be2304bee7ef56678d719ea3a09999a95cce/docs/handoffs/009/QA_HANDOFF.md), **read together with** [updated PR #20 handoff](https://github.com/zyyu1/personal-workspace/pull/20#issuecomment-7082997195). The in-branch QA_HANDOFF was authored before later script and CI events; **it is not the last word on CI history**.  
**Source Run04 report:** [MODULE_009_FOCUS_DIAGNOSTIC_RUN04.tex](https://github.com/zyyu1/personal-workspace/blob/9e7b4aa/docs/handoffs/009/reports/MODULE_009_FOCUS_DIAGNOSTIC_RUN04.tex), evidence-only reporting branch.

## 1. Independent verification of developer handoff gate

The Design Window verified via GitHub API, the actual Actions job summary **and decoded job logs**:

- [GitHub Actions run 45050344151](https://github.com/zyyu1/personal-workspace/actions/runs/45050344151): `status=completed`, `conclusion=success`, `run_attempt=1`, exact `head_sha=a042be2304bee7ef56678d719ea3a09999a95cce`.
- Job `verify (typecheck, lint, build, test, diff-check)`: npm ci, Typecheck, Lint, Build, Test, Diff Check and cloud Chrome Browser Smoke all **SUCCESS**. **12 test files / 186 passed**; lint **0 errors, 12 pre-existing Research warnings**.
- Browser Smoke **30/30** checks / **0 failed**, including 15 complete create→Inspector→Escape→focus cycles: 5 each at **1440×900**, **1024×768**, **390×844**, where focus returns to the **identical connected create input** after **5–28 milliseconds** (no timeout and no >250ms delay).
- Exact observed latencies in ms: **1440×900: 26, 8, 8, 11, 8**; **1024×768: 26, 25, 10, 8, 27**; **390×844: 28, 5, 6, 5, 26**. The **immediate activeElement was body in all 15 trials**, later restored to original input. The CI script reports `targetConnected=true`, `targetIsSameElement=true` for each; the Design Window inspected the script and job output.
- Historical regressions are explicitly retained: [Run 45049036051](https://github.com/zyyu1/personal-workspace/actions/runs/45049036051), **both attempts FAILURE** at `b9fd763` (immediate Escape focus null at 1440 first and 1024 second). Earlier [run 45047487262](https://github.com/zyyu1/personal-workspace/actions/runs/45047487262) SUCCESS at `ed1c409`. This sequence **supports a smoke-observation timing race**, but does **not establish** that a production focus race is impossible or that a transient body focus is acceptable in all situations.
- Candidate PR #20 was confirmed OPEN / DRAFT / UNMERGED with GitHub `mergeable_state=clean` at the checked head, while Issue #19 is OPEN. **Mergeable does not mean approved to merge.**
- Run04's one authorized script-only commit and one naturally triggered exact-head CI run meet [the bounded focus-diagnostic authorization](./MODULE_009_FOCUS_DIAGNOSTIC_SCRIPT_REMEDIATION_AUTHORIZATION.md). **No app code change was undertaken under this step.**

**Interpretation:** the candidate has crossed the **developer-to-independent-QA intake gate**, not the final product acceptance gate. Developer self-check remains **29 PASS / 1 PARTIAL** (row 29); this is never an independent QA score.

## 2. Review Only separation / operator

A **different, independently appointed Review Only QA window/operator** must check the exact commit. The developer/Claude cloud executor is **STOPPED** after handoff. The QA operator is not allowed to implement fixes, modify `codex/module-009`, edit the workflow or smoke script, push commits, force/rebase/reset, mark PR ready/merge, close Issue #19, or convert developer self-check to QA PASS without independent evidence.

QA can inspect the repository and GitHub Actions, build a **separate non-writing review checkout**, run read-only verification, and (with appropriate explicitly granted local access) perform Windows/browser/permission-required verification. It must not pretend the cloud reviewer has access to the user's Windows machine, native folder picker or private local data.

**Immediately before review:** re-fetch PR #20 live head and its state. If the head is no longer `a042be2304bee7ef56678d719ea3a09999a95cce` or source changed since handoff, **STOP and ask Design Window for a new fixed SHA**. Do not move the QA anchor automatically to the latest commit.

## 3. Required independent 30-row evidence and elevated focus

Apply **every one of the 30 exact frozen design acceptance rows** in `DESIGN_APPROVED.md` §10. Return a row-by-row matrix `PASS / PARTIAL / FAIL / NOT VERIFIED` with precise test/browser/repository evidence and any gaps. Distinguish CI-verified outputs from QA's *own* reproduced checks, and separate cloud Chrome from Windows-host evidence.

**Highest-priority checks:**

1. **Row 29 keyboard / focus / viewport / permissions / Windows:** Independently reproduce create→auto-open Inspector→Escape focus restoration with real keyboard input, repeated at **1440×900, 1024×768, 390×844**; capture immediate/final active element, focus timing, target identity/connectivity, focus-trap/Tab behavior, screen-reader labels/ARIA, viewport overflow and missing/error/permission-required states. Specifically test Resource `openOriginal` with inaccessible/other-device and permission-denied sources in a real browser. When relevant native Windows folder/file capabilities cannot be accessed, **report PARTIAL / NOT VERIFIED** rather than simulating Windows acceptance. Judge whether a momentary focus on body before React Effect cleanup creates a material accessibility regression.
2. **Date truthfulness and DST:** `unknown/date-only/exact`, tentative vs user-confirmed vs source-verified vs legacy-verified, Berlin DST gap `2026-03-29 02:30` and fold `2026-10-25 02:30` with explicit disambiguation, viewer timezone and month boundary. Since `Intl` is used and no Temporal dependency installed, independently check validation semantics rather than trust the developer summary.
3. **Legacy assessment / Calendar policy:** Independently test the reported case where a prior **legacy verified exam event** is replaced/suppressed by a newly created **active but unverified exam milestone**. Determine whether the behavior faithfully represents explicit source correction, or whether a previously confirmed event disappears without adequate warning. Flag material ambiguity for Design Window; **do not amend frozen design or auto-approve the behavior**.
4. **Migration and backups:** v1→v3, v2→v3, backup-before-migrate and injected failure rollback, preserving all 007 IDs/Resource classifications and 008 Unit/Set/Item/Attempt/Evidence data; no accidental new exam generated from Past Paper/ZIP.
5. **Cross-offering correctness and canonical ownership:** real ExamSitting vs self-reported Practice, linked Course-wide Past Paper with offering-scoped practices, permission-gated GlobalResource links, 008 per-question mapping without duplicated Items/Attempts, idempotent GlobalTask ensure/retry, TimeEntry unchanged by self-reported practice.
6. **Regression and runtime:** reproduce or independently inspect accurate typecheck/lint/build/tests/diff, preserve 001–008 regression coverage, investigate CI Node24 vs Node22 baseline ZIP issue, and assess whether the smoke diagnostic actually waits for a connected **same target element** without calling focus or weakly asserting by label only. Avoid treating the old 30/30 **browser smoke** as the 30/30 **product acceptance** score.

## 4. Required QA deliverable and outcomes

- QA may publish a **review-only report** in an independent evidence location/branch or PR comment **without modifying** `codex/module-009` and without making a false pass claim. It must cite exact `a042be2` review anchor, run URL, individual findings, reproducible steps and the full 30-row matrix.
- Final label may be **ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE**, but **ACCEPTED** requires all mandatory gates fully evidenced, including unresolved row 29 / Windows and permission-required browser cases.
- If independent QA lacks a real Windows host for row 29, it may complete a preliminary read-only/cloud review and report **PARTIAL / INSUFFICIENT EVIDENCE** with precise Windows verification tasks. Do not prematurely merge or downgrade the acceptance requirement.
- QA must not fix defects itself; Design Window issues future narrow remediation authorizations and a **separate later merge authorization** after satisfactory independent QA. No automatic promotion of PR #20 out of Draft.

**UNCHANGED RESTRICTIONS:** Module 009 product design frozen, no PR merge, no Issue closure, no code agent resumed for features, no Module 010, B2B/B3, unattended scheduler/watchers, real Codex Queue or permission escalation.

**Current gate: EXACT-HEAD CI PASS / INDEPENDENT REVIEW ONLY QA AUTHORIZED AND PENDING / ROW 29 STILL PARTIAL / PR #20 DRAFT + MERGE HOLD.**
