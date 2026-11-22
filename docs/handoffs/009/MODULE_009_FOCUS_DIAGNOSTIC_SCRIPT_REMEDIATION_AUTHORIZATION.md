# Personal Workspace — Module 009 Focus-Restore Diagnostic Script Remediation Authorization

**Formal Design Window v0.0.2 decision — 2026-11-22 (Europe/Berlin)**  
**Decision:** **SCRIPT-ONLY DIAGNOSTIC REMEDIATION APPROVED / ONE NEW EXACT-HEAD CI RUN / NO APPLICATION CODE CHANGE / INDEPENDENT QA NOT STARTED / PR #20 MERGE HOLD.**  
**Scope:** Existing [Draft PR #20](https://github.com/zyyu1/personal-workspace/pull/20) on `codex/module-009` under [Issue #19](https://github.com/zyyu1/personal-workspace/issues/19).  
**Current candidate before this authorization:** `b9fd7637ab66ef1e37afc43fb1968e0b8e26670c` (must recheck before edits).  
**Report:** [Run03 CI Diagnostic .tex](https://github.com/zyyu1/personal-workspace/blob/52b9e60/docs/handoffs/009/reports/MODULE_009_RUN03_CI_DIAGNOSTIC.tex) on evidence-only `module-009-run-reports` branch, report commit `52b9e60`.  
**Prior one-rerun authorization:** [MODULE_009_RUN03_CI_DIAGNOSTIC_AUTHORIZATION.md](./MODULE_009_RUN03_CI_DIAGNOSTIC_AUTHORIZATION.md); its rerun allowance was **exhausted**.

## 1. Actual evidence and root-cause status

The Design Window independently inspected GitHub Actions [run 45049036051](https://github.com/zyyu1/personal-workspace/actions/runs/45049036051), **both attempts at the same exact head**:
- Attempt 1, job [137289855375](https://github.com/zyyu1/personal-workspace/actions/runs/45049036051/job/137289855375): **failure**. 1440×900 Escape-focus assertion observed `focusLabel=null`; 1024×768 and 390×844 restored the expected `New assessment title` focus.
- Attempt 2, job [137291827988](https://github.com/zyyu1/personal-workspace/actions/runs/45049036051/job/137291827988): **failure**. 1024×768 Escape-focus observed `focusLabel=null`; 1440×900 and 390×844 restored focus.
- In both attempts `npm ci`, Typecheck, Lint (**0 errors / 12 pre-existing Research warnings**), Build, **186/186** automated tests and Diff Check passed; browser smoke **16/17**, overall CI **FAIL** both times.
- An earlier run [45047487262](https://github.com/zyyu1/personal-workspace/actions/runs/45047487262), SHA `ed1c4095c0b9b6990da02d6fc0164decb7b03307`, had all three focus checks pass on the identical app/test-script code. Total: **2 missed immediate focus observations out of 9 across three smoke executions**. These are discrete observations, not a statistically proven flaky-test rate.
- The current smoke code waits for the Inspector element to disappear and then reads `document.activeElement` **once, immediately**. The existing shared `src/components/InspectorShell.tsx` calls `returnFocus.current?.focus()` in a React Effect unmount cleanup; `ExamsView.tsx` passes the assessment-create input as `returnFocusTo`. A race between DOM removal, passive cleanup and observation is **plausible**; a real delay/missed focus in the app is **also plausible**. **Root cause NOT YET VERIFIED**.
- Independent QA **not started**; developer self-check **29 PASS / 1 PARTIAL** (row 29). Neither past CI failures nor a future instrumented pass may be described as an independent QA acceptance.

## 2. Authorize one bounded, diagnostic-first CI script change (only)

The interactive Claude cloud development window is permitted to make **one normal non-force branch commit**, changing only:
`tools/ci/module-009-browser-smoke.mjs`

**Permitted script modifications:**

1. After simulating Escape and confirming Inspector removal, capture **first/immediate** `document.activeElement` result *before* waiting (tag, ID, aria-label, optionally element connectivity/selector) and timestamp. Preserve the prior instantaneous finding, including initial `null`; do not erase it or falsify it.
2. Poll for actual focus on the **expected, still-connected `input[aria-label="New assessment title"]` DOM element**, using real `document.activeElement === expectedInput` (not merely a matching `aria-label`). Measure elapsed time from Inspector closing; poll at ~25–50 ms intervals, bounded to **1,000 ms total**. Log `initialFocus`, `restoredFocus`, `restorationLatencyMs`, `timeout`, `targetConnected` and viewport. Never force focus from the test script, never assign `document.activeElement`, and never mark a missing/wrong/disconnected target as PASS.
3. Exercise the same create→Inspector→Escape→focus flow **five complete times per viewport** (1440×900, 1024×768, 390×844; **15 diagnostic cycles** total) with distinct explicit IDs/titles and clean isolation. Ensure the loop itself does not bypass the create/inspector logic or change application product behavior; avoid arbitrary sleeps as a substitute for state conditions. Keep all other existing browser assertions (DST gap, deep link/IndexedDB, Calendar exactly-one event, overflow, console error) at least as strong as before. Record each cycle's initial and eventual focus independently.
4. **Fail CI** if any of the 15 cycles has no correct connected target focused within 1,000 ms, if the Inspector does not close, if focus moves to the wrong element, if automation exceptions occur, or if any previously required regression check fails. If focus arrives **later than 250 ms** but before timeout, the script must log and flag it as a **potential user-visible delay**, not silently classify it as an unqualified focus success; the QA handoff must highlight it for Design Window/independent QA examination. The 250 ms marker is an investigative review threshold, not a frozen product requirement.
5. No modifying the frozen acceptance matrix, hiding past failures, removing the focus assertion, widening the timeout above 1 second, suppressing errors, changing CI job to optional, or changing workflow, `package.json`, lockfile, production code, tests, authorization docs, branch protections, secrets or unrelated projects.

**Git/CI constraints:** re-verify live PR #20 OPEN/DRAFT, exact current HEAD `b9fd7637ab66ef1e37afc43fb1968e0b8e26670c`, no parallel writer and clean branch before editing. If HEAD changes unexpectedly, STOP. Push one normal non-force script-only commit to the existing branch; this automatically triggers **one new CI run** under the already-approved workflow. Do **not** manually rerun on failures, make dummy retrigger commits, or perform another main→branch merge solely for this authorization. This new authorization is written to main as a **new separate file** without touching STATUS to avoid another document conflict.

## 3. Results and subsequent gates

**A. One new exact-head CI is GREEN and all 15 focus cycles restore correctly within 1 second, all other browser/186 automated regression checks pass:**
- Present exact SHA, run URL, full recorded per-viewport focus latency and initial immediate observations. Explicitly preserve and link **both failed attempts** from run 45049036051 and the old green `ed1c409` reference; distinguish a diagnostic script update from an app fix.
- **Review Only QA handoff is permitted** on PR #20 and Issue #19 with this evidence, **provided every late restoration >250 ms is explicitly disclosed**. Keep PR DRAFT. A late restoration remains a potential UI risk for independent QA, not an automatic clean PASS.
- Developer row 29 stays **PARTIAL** pending real-browser accessibility, permission-required and relevant Windows host evidence. Independent Review Only QA must stress focus restoration, audit this diagnostic adjustment and adjudicate any observed delays; a green CI does **not** establish app correctness or close a finding.
- No more code edits or reruns after handoff without a new scoped decision.

**B. Focus never arrives by 1 second, other failures arise, or the CI run is inconclusive:**
- **STOP** with exact SHA, failures, elapsed focus timings, affected viewport/sequence, CI URL and before/after script diff. Do **not** change `InspectorShell`, `ExamsView` or any feature code under this authorization. Request a new focused application-remediation authorization.
- No retry-until-green. A rerun failure cannot be relabeled as PASS because other test steps succeed.

**C. A new CI run is green but focus is consistently slow (>250 ms):**
- Same as A for starting **Review Only QA with an explicit latency finding**, not treating user-visible delayed focus as solved. Design Window may require a subsequent narrow fix based on independent QA.

## 4. Boundaries

This is a limited **replacement for the exhausted CI rerun permission**, not a retrospective approval of earlier cloud coding or a new open-ended cloud development release. It authorizes **only diagnostic instrumentation of the already existing browser-smoke script**, one commit and its natural CI trigger. In particular: no production `InspectorShell` focus fix without a new separate approval, no merge PR #20 into `main`, no un-DRAFT release, no independent 30/30 PASS claim, no Issue #19 closure.

No Module 010, B2B/B3, real Codex Queue, unattended polling or scheduler, additional package dependencies, cloud-native Windows impersonation, or unrelated runtime access is authorized. If the existing cloud session cannot make this narrow script-only change safely, STOP and request an interactive local Windows handoff rather than broaden the scope.

**Final gate:** **DIAGNOSTIC SCRIPT PATCH AUTHORIZED / ONE NEW EXACT-HEAD CI PENDING / INDEPENDENT QA HOLD UNTIL EVIDENCE / ROW 29 PARTIAL / PR#20 MERGE HOLD.**
