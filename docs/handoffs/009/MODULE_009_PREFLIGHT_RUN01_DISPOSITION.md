# Module 009 — Preflight Run 01 Design Window Disposition

**Date:** 2026-11-22 (Europe/Berlin)  
**Decision:** **CLOUD ENVIRONMENT STOP ACCEPTED / EXECUTION REASSIGNED TO LOCAL WINDOWS CLAUDE CODE (CONDITIONAL NEW PREFLIGHT) / CODE START AUTHORIZATION UNCHANGED / MERGE HOLD.**  
**Issue:** [#19](https://github.com/zyyu1/personal-workspace/issues/19) (OPEN).  
**Report evidence:** [MODULE_009_PREFLIGHT_RUN01.tex](https://github.com/zyyu1/personal-workspace/blob/2746f9493996225929fc33763f090bc3e825c73f/docs/handoffs/009/reports/MODULE_009_PREFLIGHT_RUN01.tex) on **`module-009-run-reports`**, commit `2746f9493996225929fc33763f090bc3e825c73f` (the report is **not** on `main` and is not a development PR).  
**Baseline observed at this Design Window decision:** `main` `b6140bd08d70309d3b6dceefe62dd32c738f88b7`.

## 1. Verified facts and source-report qualifications

- The source report says the cloud repo was clean and correct and observed main `1101415bcedd264da1440601b29c124157c7aa2a`; accepted 007/008 merges and the 009 code-start scope were present. Main subsequently advanced through **two documentation-only commits**, introducing [the already approved scoped CI permission](./MODULE_009_CI_PERMISSION_APPROVAL.md) and appending it to [STATUS](./STATUS.md). GitHub comparison `1101415...b6140bd` shows **no `src/` changes**.
- GitHub currently confirms Issue #19 **OPEN**, `codex/module-009` branch **absent**. The full report says no Module 009 code, dependencies, PR, or Issue comments were made; design windows treat those as **execution-window self-report**, corroborated where GitHub evidence is available.
- Cloud environment report: Node `v22.23.5` / npm `10.9.9` installed but **`node_modules` absent**, `npm view vite version` failed `ENOTFOUND registry.npmjs.org`, `npm ci --offline` failed `ENOTCACHED`; Typecheck/Lint/Build/Test, `@js-temporal/polyfill` install/lockfile and actual browser-run validation **NOT RUN / BLOCKED**, not application-code FAIL.
- Run01 source report explicitly states the **frozen Module 009 design body and 30 acceptance rows had not yet been read in full** (outline only). The new executor **must read the complete design and all 30 rows before coding**, even though that omission did not cause the environment STOP.
- The report states `ci-github-actions` permission was pending at the time of its preflight. That statement is **historical**: user then approved [scoped CI](./MODULE_009_CI_PERMISSION_APPROVAL.md), recorded on main in commits `34d9b5e78701daa52d1d05aea82318e996b74e4f` and `b6140bd08d70309d3b6dceefe62dd32c738f88b7`. CI approval neither supplies npm network to the blocked cloud session nor substitutes for actual browser checks.

## 2. Binding decision: Option 1 — local Windows Claude Code

**Approved continuation path:** Use a **genuinely local Windows Claude Code Development / Execution Window**, one in which the user has explicitly opened/authorized the real repository folder and where PowerShell/Git/npm/browser can actually operate. This execution location was already allowed in [Module 009 Start Authorization](./MODULE_009_START_AUTHORIZATION.md). No Windows access is inferred from a Claude cloud session merely connected to a machine name.

- The failed cloud session **stays STOPPED for implementation** and must not create a Module 009 code branch or work around registry/network policy.
- This decision **does not authorize changing Claude/cloud network settings**, adding remote-control permissions, issuing elevated tokens, installing hidden Windows services or using any automatic agent.
- **No assumption** is made that the local machine's npm registry, Node version, GitHub push ability, browser, or worktree are healthy; the new local executor must prove these gates.

## 3. Mandatory Windows Run 02 READ-ONLY PREFLIGHT (before coding)

1. User starts an interactive **local Windows Claude Code** session with access to their intended clone; confirm real Windows local path, `git remote -v`, `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, and GitHub authentication / permissions. Do not clobber any existing local changes.
2. `git fetch origin`, then inspect `origin/main`, Issue #19, separate CI approval, this disposition, and **entire frozen `DESIGN_APPROVED.md` including all 30 frozen QA requirements**, `EXECUTION_INSTRUCTION.md`, start authority, actual interface/migration audit and OSS review. Ensure 007 and 008 accepted merges are present and that the branch `codex/module-009` is absent or safely accounted for; do not reset the current worktree destructively.
3. Verify network access to npm registry, Node/npm compatibility, complete lockfile and `npm ci` success **without touching a user's other workspace**; if necessary, use a clean authorized isolated checkout. `npm ci` is a write operation to dependencies and therefore must occur **only after** read-only repo/identity/permission checks and when the active local executor is authorized to prepare the environment.
4. Run **baseline** `npm run typecheck`, `npm run lint`, `npm run build`, `npm test -- --run`, `git diff --check` and actually launch the application in a local browser. Record commands, outputs, versions, failures and actual available browser size support (1440×900, 1024×768, 390×844) without inventing results. Browser environment must be clearly labeled Windows-local; no native host file-picker claim unless explicitly tested.
5. If any environment/branch/data/source identity gate fails, **STOP** and return a Run 02 diagnostic. If all pass, proceed **only** under the existing frozen 009 instruction and start authority: create isolated `codex/module-009` from latest main, implement and test Module 009, prepare PR plus exact HEAD/QA handoff, and STOP for independent Review Only QA. Do not auto-merge.

## 4. Non-changes and preserved holds

- **Design remains frozen; code-start authority unchanged.** The original Module 009 independent development start authorization is active conditional on actual executor preflight; this disposition does not silently launch execution.
- **CI authorization remains scoped and approved** (read-only, minimal workflow for 009 PR, no secrets, no auto-merge). It is not a release to run unattended services or to edit branch protections/organization settings.
- **Module 009 actual implementation:** **NOT STARTED** as of the verified GitHub snapshot; **Independent QA:** NOT STARTED; **PR merge:** NOT AUTHORIZED. CI success alone cannot replace independent QA.
- No Module 010, B2B/B3, always-on/cloud daemon, Codex Queue, schedule/cron, university integration or exam auto-grading authorization.
- Reports branch `module-009-run-reports` is **evidence only**; never merge or repurpose it as `codex/module-009`.

**Next executor action:** Windows local Run 02 preflight, then code only if all gates actually pass. No automatic work is triggered by this decision.

## 5. Post-decision live GitHub observation — approved CI-only Draft PR #20

**Later verification in this same Design Window, 2026-11-22:** after the initial Run01 outcome and before this addendum, GitHub acquired [Draft PR #20](https://github.com/zyyu1/personal-workspace/pull/20), OPEN / DRAFT / NOT MERGED, from existing `codex/module-009` with observed head `d131025bf8c7b67f6fcae8ac798c6a662244a974`. Its observed diff is **one added file only**: `.github/workflows/module-009-ci.yml` (77 added lines), created by commit `d131025`; **no Module 009 application code, schema changes, tests or QA handoff have been committed in that PR snapshot**. This CI-only PR is **not** evidence that the blocked cloud environment recovered or that the original STOP no longer applies.

This is a live-state correction to earlier Run01 text saying the branch/PR did not exist **at the time of Run01**. **Do not delete or recreate the existing branch/PR**, and do not treat it as an independent-QA-ready implementation. It was opened as DRAFT for already approved CI validation; the final 009 implementation/QA gate remains unmet.

**Amended Windows Run02 branch handling:**
1. Before any source edit, the genuinely local Windows Claude Code operator must re-fetch GitHub and confirm PR #20 is OPEN/DRAFT, its current head is the expected `d131025bf8c7b67f6fcae8ac798c6a662244a974` (or STOP for unexplained later changes), and the PR diff remains CI-only.
2. Verify a clean local checkout, remotes/permissions, the latest `origin/main`, full frozen design and all 30 rows, and npm/browser proof. If the branch already exists locally, inspect/confirm ownership instead of overwriting it.
3. After successful preflight, **continue using the existing `codex/module-009` branch and PR #20** rather than creating a second development branch/PR. Safely incorporate latest documentation-only `main` commits through an ordinary non-destructive merge if needed; **no force push, destructive reset or rebase of a shared branch**, and STOP for unanticipated conflicts or source changes. Confirm full contract diff and branch/current main ancestry again after sync.
4. Do not claim CI success merely from workflow creation. Actual GitHub Actions run must be checked with exact SHA, and deployment/artifact upload must not disclose private files or introduce extra write scopes. This addendum **does not approve any new privileged CI scope**.
5. Only after 009 code implementation and its full test/real browser evidence can PR #20 transition from DRAFT to formal independent Review Only QA. **No merge authorization**.

**Current factual state for this addendum:** Module 009 DESIGN FROZEN; execution still **ENVIRONMENT STOP at Run01**, Windows Run02 required; **Draft CI-only PR #20 now exists**, not QA-ready, no merge authority. If any operator is actively changing PR #20, re-read its latest HEAD and STOP on unexpected state rather than assuming this snapshot remains current.
