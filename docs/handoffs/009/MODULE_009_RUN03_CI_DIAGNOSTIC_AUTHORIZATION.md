# Module 009 — Run 03 Diagnostic CI Rerun and Review Only QA Gate

**Design Window v0.0.2 formal decision — 2026-11-22 (Europe/Berlin)**

**Decision:** **OPTION 1 CONDITIONALLY APPROVED — ONE DIAGNOSTIC RERUN OF EXISTING FAILED CI JOB / NO CODE CHANGES / QA REQUEST ALLOWED ONLY WITH DISCLOSED HISTORY / PR #20 MERGE HOLD**.

**Work order:** [Issue #19](https://github.com/zyyu1/personal-workspace/issues/19).  
**Candidate:** [Draft PR #20](https://github.com/zyyu1/personal-workspace/pull/20), branch `codex/module-009`.  
**Exact tested/authorized candidate HEAD:** `b9fd7637ab66ef1e37afc43fb1968e0b8e26670c`.  
**Source evidence:** [Run 03 LaTeX report](https://github.com/zyyu1/personal-workspace/blob/cbb890e/docs/handoffs/009/reports/MODULE_009_RECONCILIATION_RUN03.tex), `module-009-run-reports` evidence-only branch.  
**Preceding authorization:** [Cloud conflict reconciliation](./MODULE_009_CLOUD_CONFLICT_RECONCILIATION_AUTHORIZATION.md), which authorized only a non-force main→branch merge, exact-head CI and Review Only QA handoff.  
**Actual non-force merge completed:** `b9fd7637ab66ef1e37afc43fb1968e0b8e26670c` with parents `845c82513f4ff233035d572146423eeed9eec7f4` (dev) and `37790dd6f3d70afd6cd28d4588dc7ec31e10b4ca` (then main). Its commit file listing is limited to `docs/handoffs/009/`; source code, tests, CI workflow and dependencies were not changed by the merge. PR #20 currently OPEN/DRAFT/UNMERGED, GitHub `mergeable_state=unstable` from a failing check, not a remaining merge conflict.

## Verified failing evidence — do not conceal

- [GitHub Actions run 45049036051](https://github.com/zyyu1/personal-workspace/actions/runs/45049036051): **completed / FAILURE** at precise HEAD `b9fd7637ab66ef1e37afc43fb1968e0b8e26670c`, first attempt. `npm ci`, Typecheck, Lint, Build, all 186 tests, `git diff --check` **SUCCESS**. Lint: zero errors and 12 previously identified Research warnings. Browser smoke failed **1 of 17 checks**, so overall CI is **FAIL**, not PASS.
- GitHub job logs confirm exact failure: in the 1440×900 Chrome smoke, after Escape, `focusLabel: null` rather than `New assessment title`; at 1024×768 and 390×844, focus returned correctly. The earlier identical-code/script run [45047487262](https://github.com/zyyu1/personal-workspace/actions/runs/45047487262) at SHA `ed1c4095c0b9b6990da02d6fc0164decb7b03307` **passed** the same smoke check. Distinguish separate exact heads and attempts.
- The current script waits for the Inspector element to disappear and immediately reads `document.activeElement`. A test timing race is **plausible**, and a real occasional app focus-restoration race is **also plausible**. Neither has been established as root cause. A simple rerun PASS would not disprove a flaky app behavior.
- Developer self-check stays **29 PASS / 1 PARTIAL**; acceptance row 29 (real-browser keyboard/focus/permission and Windows host evidence) remains **OPEN/PARTIAL**. No independent Review Only QA has accepted the code or verified all 30 requirements.

## One-time diagnostic rerun authorization (bounded)

The existing interactive Claude cloud execution window may:

1. Recheck live GitHub: repository exact identity, Issue #19 OPEN, PR #20 OPEN/DRAFT/UNMERGED, HEAD **exactly** `b9fd7637ab66ef1e37afc43fb1968e0b8e26670c`, unchanged CI workflow, and no parallel actor modifying the branch. If any mismatch, **STOP** and request a new Design Window ruling.
2. Trigger **at most ONE manual rerun of the already-failed job** in **run 45049036051** (job ID `137289855375`) against the **same exact commit**. No workflow edits, new Git push, dummy change/push to retrigger CI, different code, new PR or additional CI scopes. Preserve the previous failure as audit evidence; retain real first and second attempt URLs/IDs, test/head SHA and conclusions.
3. Inspect and honestly report actual rerun status, step conclusions, browser outputs and 1440×900 focus label. Do not claim a green status before the host returns `success`. If GitHub Actions rerun permission is missing or workflow rerun cannot be restricted to the exact HEAD, **STOP** rather than seek new privileges, change code or bypass security.
4. **If the single rerun is completely SUCCESS at that same HEAD** (all required build/tests and all browser smoke assertions pass), the cloud operator may publish the **Review Only QA request** to PR #20 and Issue #19 **without editing branch files**. The handoff must cite **BOTH** first failed and later successful CI attempts, exact SHA, the failure's `focusLabel=null`, the intermittent-risk caveat, 186/186 automated tests, `QA_HANDOFF.md`, and the developer matrix **29 PASS / 1 PARTIAL**. Keep PR #20 **DRAFT**, no merge/auto-merge. Independent QA must deliberately stress Escape focus restoration at all three viewports and permission-required states, and acquire Windows-host evidence as specified in the frozen matrix.
5. **If the rerun FAILS again, is inconclusive, canceled, or exposes new regressions**, **STOP** without declaring QA-ready. Report both runs and request a new scoped remediation authorization. Do not perform repeated retries until a green attempt occurs; no edits to test wait timing or app focus logic under this authorization.
6. After either an authorized Review Only QA handoff or an unsuccessful diagnostic attempt, **STOP**. Never self-certify 30/30 PASS, claim independent QA, close Issue #19 or merge PR #20 to main.

## QA priority independent of a green rerun

- In the final independent Review Only QA, **row 29 remains PARTIAL** until the user-visible focus-restoration behavior is characterized (real focus restoration versus test timing), repeated at 1440/1024/390, and relevant Windows/browser/permission-required evidence is recorded. A successful rerun permits **starting** QA; it does **not** pass row 29 or erase the first failure.
- If QA determines a real application focus issue, Design Window must publish a narrow remediation for app code. If it determines only a CI script race, Design Window may separately authorize a bounded deterministic-wait/diagnostic instrumentation change. No fix is preapproved here.
- Review the legacy verified exam Calendar replacement behavior and IANA/DST edge cases as other known QA risks.
- Do not needlessly trigger branch sync for this main-only document: **this authorization is published on main without touching `docs/handoffs/009/STATUS.md`** precisely to avoid a new main↔PR STATUS conflict. Do not merge main into the branch again solely to copy this decision; PR/Issue comments can link the main source.

**Still NOT authorized:** code edits, smoke-test changes, multiple reruns/green-result hunting, PR #20 merge, changing protected GitHub settings, using secrets/elevated token, starting Module 010, B2B/B3, Codex Queue, background scheduler, or new autonomous cloud jobs. The user still must initiate any executor session and approve any host permission dialog requiring user action.

**Current gate:** **ONE EXACT-HEAD DIAGNOSTIC RERUN AUTHORIZED / FIRST CI ATTEMPT FAILED / INDEPENDENT QA WAITING / 29 PASS + 1 PARTIAL DEV SELF-CHECK / PR #20 DRAFT + MERGE HOLD**.
