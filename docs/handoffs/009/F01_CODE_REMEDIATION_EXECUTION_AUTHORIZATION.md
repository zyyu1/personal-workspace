# Module 009 — F-01 Revision 01: Scoped Code Remediation & Independent QA Return Handoff

**Design Window approval / user-authorized execution instruction — 2026-11-22 (Europe/Berlin)**

**Authority:** **F-01 CODE REMEDIATION AUTHORIZED FOR THE EXISTING INTERACTIVE EXECUTION WINDOW ONLY / PR #20 STAYS DRAFT / EXACT-HEAD CI AND INDEPENDENT REVIEW ONLY QA REQUIRED / MERGE HOLD.** This file **does not launch** an execution process. User must initiate the existing Claude Code Development / Execution Window, and any actual host permission prompt still needs the user's explicit action.

**Repository:** [zyyu1/personal-workspace](https://github.com/zyyu1/personal-workspace).  
**Work Issue:** [#19](https://github.com/zyyu1/personal-workspace/issues/19), OPEN.  
**Existing implementation PR:** [#20](https://github.com/zyyu1/personal-workspace/pull/20), `codex/module-009`, OPEN/DRAFT/UNMERGED.  
**Expected candidate before remediation:** `a042be2304bee7ef56678d719ea3a09999a95cce` — the independent QA's fixed reviewed SHA; **stop if actual head has changed unexpectedly**.  
**F-01 binding design ruling:** [F01_LEGACY_VERIFIED_CALENDAR_PRESERVATION_RULING.md](./F01_LEGACY_VERIFIED_CALENDAR_PRESERVATION_RULING.md), published on main commit `b8742a6d98a99693b1b353bb189219ce85103981`.  
**Frozen product contract:** [DESIGN_APPROVED.md](./DESIGN_APPROVED.md) §5.1, §8, exact QA 30-row matrix (unchanged).  
**Independent QA evidence:** [MODULE_009_INDEPENDENT_QA_REVIEW_a042be2.tex](https://github.com/zyyu1/personal-workspace/blob/720abcfa14c9d3cc69844240264415b62e6c8856/docs/handoffs/009/reports/MODULE_009_INDEPENDENT_QA_REVIEW_a042be2.tex), **26 PASS / 4 PARTIAL / 0 FAIL / INSUFFICIENT EVIDENCE**; F-01 MEDIUM, row 25 PARTIAL.  
**Known CI:** [run 45050344151](https://github.com/zyyu1/personal-workspace/actions/runs/45050344151) SUCCESS at the **old** `a042be2`, **not evidence for the remediation's new HEAD**.

## 1. Mandatory preflight and separation

1. **Read all documents above fully**, plus Module 009 `EXECUTION_INSTRUCTION.md`, original `QA_HANDOFF.md`, CI authorization, scoped F-01 ruling, independent QA report and existing PR #20's developer + QA comments. Do not misread 30 CI browser smoke *log entries* as the 30 product acceptance rows.
2. Confirm actual GitHub repo identity, `origin`, clean authorized worktree, existing `codex/module-009` branch, PR #20 OPEN/DRAFT/UNMERGED, Issue #19 OPEN, accepted Modules 007/008 in ancestry. Independently verify PR head **exactly** `a042be2304bee7ef56678d719ea3a09999a95cce`, no parallel writer, and main's new ruling is read **without merging main into the branch just for handoff documents**. If head differs, local changes are present, merge requires an unplanned source change, or access/permissions differ: **STOP** and return a preflight report. Never delete/recreate PR #20.
3. Use the pre-existing `codex/module-009` branch only, with normal non-force commits/push. No `git reset --hard`, rebasing shared history, cleaning user's files, force push, new implementation branch/PR, or automatic merge.
4. **Keep developer and independent QA separate.** This Development Window is permitted to fix the bounded F-01 issue; it is **not** the later Review Only QA Window, and cannot certify its own final product acceptance.

## 2. Binding F-01 product behavior

**An unverified/unknown date is a pending candidate, NOT an instruction to revoke a previously confirmed exam date.** A source-verified, user-confirmed, or previously verified legacy date can be displaced for Calendar only by a **new dated, eligible user-confirmed/source-verified milestone** or a separate explicit invalidation (not authorized here). Thus preserve a single confirmed Calendar exam item if still-valid confirmed evidence exists; distinguish it from the newer tentative date with a conspicuous review warning.

- **Calendar source and identity:** same `id=calendar-assessment:<assessmentId>`, `sourceType='assessment-deadline'`, `canonicalSourceId=<assessmentId>`, correct offering. No duplicate, no fabricated midnight/timezone, and no projection of `unverified` as a confirmed deadline. Keep separate registration/withdrawal milestones unchanged.
- **Legacy fallback:** if legacy verified 007 has a valid existing `officialDateTime`, preserve its old date/time/IANA/provenance/verification and existing Calendar visibility while a newer unverified/unknown exam proposal exists. Mark the event **Previously verified · Reconfirmation needed**, with separate pending-review metadata/presentation rather than falsifying `verification='source-verified'`.
- **History-safe precedence:** if a prior 009 milestone was *already confirmed* and replaced the 007 legacy date, and then a newer unverified proposal supersedes that milestone in the existing history, retain the **most recently confirmed still-valid** evidence, not the obsolete 007 legacy value. A confirmed milestone that was intentionally canceled must **not** cause an older confirmed/legacy record to resurrect accidentally. Canceling a merely tentative proposal does not itself revoke a still-valid confirmed date. Do not claim that merely checking `isCalendarEligible` before adding `examAssessmentIds` solves all chains.
- **A newly confirmed replacement:** `user-confirmed` and `source-verified` dated milestones (with existing source validations) replace current effective confirmed date. `date-only` is an all-day/date-only item (no `start` or `end` fabricated), `exact` respects original local time, IANA zone, instant, DST gap/fold rules. The old source stays in its historical 007 or milestone records, without a second active Calendar exam event.
- **Assessment cancellation/archive** excludes upcoming Calendar projections, retains all audit records. No automatic change to registration status, ExamSitting/result, Task, Resource, TimeEntry, Past Paper or exercise records.
- **Truthful shared UX:** Calendar, Exams card, Exams Inspector and Course Overview must agree which confirmed date is presently projected and distinguish any **newer tentative** proposal from historical confirmed evidence. In the overlap state show both dates and a textual, accessible review warning; avoid conflicting messages like “Tentative · not on Calendar” when the previously verified exam fallback is actually present.
- **Save-time warning:** for `kind='exam'` + `verificationStatus='unverified'` or `datePrecision='unknown'` when an effective confirmed date already exists, make clear before saving that this **records a tentative proposal** and does **not** replace the Calendar date; after saving, show the pending-review warning wherever relevant. Do not add a hidden automatic deletion/invalidation, and do not conflate opening a form with user approval.

**Data-model STOP boundary:** Current `setMilestone` supersedes prior active milestones without distinguishing tentative vs effective, so history-chain handling is essential. Use an auditable derived resolver over **existing** v3 historical fields when possible, shared across Calendar/Overview/Exams. If correctness instead requires a new persisted pending/current lifecycle field, a schema version bump, migration, new canonical store, or new “invalidate old confirmed date” UX/action, **STOP BEFORE that work**, describe the minimal exact type/schema/migration delta, compatibility/rollback concerns, and request a *separate* Design Window decision. Do not silently reshape approved v3 state.

## 3. Allowed implementation file scope

Change **only files demonstrably required to implement the above F-01 behavior**, from this allowlist:

- `src/services/globalCalendarService.ts` — select the effective exam projection, preserve one stable event, expose truthful pending-review signal.
- `src/features/study/services/studyExamService.ts` — narrowly scoped shared read-only effective-date/status resolver and existing summary integration; **no new persistent storage shape**.
- `src/features/study/components/ExamsView.tsx` — show effective confirmed + tentative dates, warnings, and clarify save action.
- `src/features/study/components/CourseWorkspace.tsx` — make Overview assessment summary truthful/consistent with Calendar.
- `src/components/GlobalCalendarPage.tsx` — present readable review warning for prior verified fallback without falsifying verification.
- `src/features/study/StudyExams.test.tsx` — F-01 regression/service/UI tests, keeping old tests.
- `src/features/study/Study.test.tsx` — **only if strictly necessary** for Course Overview cross-view regression.
- `src/styles.css` — **only if needed** for accessible warning styles consistent with existing UI.

Do **not** edit `src/features/study/types.ts`, repository schema/migration, Module 007/008 code, global Task/Timer/Resource services, `package.json`, lockfile, CI workflow, browser-smoke diagnostic script, unrelated feature files, frozen design, or authorization history without separate Design Window approval. No dependency additions. If another file is truly necessary, **STOP and ask for a bounded scope extension** rather than touching it.

Prefer a **single reusable effective-date resolver** with explicit input/output and deterministic chronology/provenance logic, so Calendar, Exams and Overview cannot independently contradict one another. Existing history must not be deleted; no backfill/mutation to old `CourseAssessment` fields. Treat unknown date, canceled confirmed milestone, most recent confirmed evidence and cross-offering ownership carefully.

## 4. Required tests before CI / 12 frozen F-01 cases

Add direct regression tests for **all** [F01-01..F01-12 scenarios](./F01_LEGACY_VERIFIED_CALENDAR_PRESERVATION_RULING.md) in the ruling. Minimum groups:

1. **Legacy verified + tentative date-only/exact/unknown** each preserves precisely one original Calendar event, original date/time/zone/source and correct stable ID; tentative stays only in Exams; the warning is explicit and accessible.
2. **Legacy verified + later confirmed date-only/exact** each replaces with precisely one new event; never fabricates time or upgrades provenance; canceled/archived *assessment* has zero event; canceling tentative clears review warning without destroying verified evidence.
3. **Already-confirmed 009 A → pending unverified B** retains A, not obsolete legacy; **A → confirmed B** projects only B; user cancellation of latest *confirmed B* does not silently resurrect A/007; reload and same-day records preserve identity. If current schema cannot represent this without changing ownership semantics, STOP and report the design-model limitation.
4. **Exams / Overview / Calendar UI consistency** for conflicting dates and no-date cases: both source values visible; textual warning prior to saving a tentative proposal and after save; no contradictory “not on Calendar” while a fallback actually appears; Event navigation opens correct Exams Inspector; no cross-offering leakage.
5. **Unchanged regressions:** DATE timezone/DST/date-only, v1/v2→v3 migrations/backups, 007/008 identities, Task/TimeEntry idempotency and non-duplication, multiple registration/withdrawal deadlines, accessibility/keyboard and 390/1024/1440 layout coverage as available.

Do not relax existing assertions, decrease scope of focus diagnostics, hide console failures, delete prior test cases or assert PASS based only on source reading. Return the **mapping from F01-01..12 to specific test names and result evidence**. UI/browser checks cannot be called Windows validated from cloud CI.

## 5. Execution, exact-head CI, GitHub publication and independent QA pull

**After preflight, implementation and tests:**

1. Commit F-01 source/tests only to existing branch with normal commit(s), no force. Record the **new full 40-character HEAD** and exact file diff. Prefer one tightly scoped commit. Keep [Draft PR #20](https://github.com/zyyu1/personal-workspace/pull/20) OPEN/DRAFT/UNMERGED.
2. Use the previously approved CI workflow. Its natural `pull_request` trigger should run against the new PR head. Independently verify each result against **the same exact new HEAD**: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm test -- --run`, `git diff --check`, and browser smoke. Report actual run ID/link, head SHA, step conclusions, total test count and warnings. **Do not claim PASS before GitHub confirms it**; never rely on old run `45050344151`. No dummy trigger commits, repeated manual reruns or workflow privilege change. If CI FAIL/inconclusive, **STOP and report**; a new remediation authorization is required.
3. Publish **durable GitHub results** after a real green exact-head CI: (a) comprehensive **F-01 Revision 01 Developer Evidence** comment on **PR #20**; (b) a concise linked status comment on **Issue #19**; (c) an evidence-only Markdown report `docs/handoffs/009/reports/MODULE_009_F01_REMEDIATION_REV01.md` on existing `module-009-run-reports` branch **if it can be safely written with no force/overwrites**. If the evidence-only branch is concurrently changing or a permissions issue arises, do not overwrite it; PR+Issue handoff suffices, and disclose the report-branch obstacle. Do **not** add post-CI documents/commits to `codex/module-009`, as that would change the exact candidate HEAD and invalidate the evidence anchor.
4. PR handoff must contain: fixed full 40-character HEAD, parent SHA, exact changed files, QA F-01 root cause and effective-date rule, 12-case test matrix with names, results, CI HEAD/run URL, any missing/partial browser proof, and clear **F-01 only, other QA findings remain open**. Also supply the **full historical CI chronology** including [45045784496](https://github.com/zyyu1/personal-workspace/actions/runs/45045784496) and [45047256878](https://github.com/zyyu1/personal-workspace/actions/runs/45047256878) (the previously omitted F-02 runs), the later failed [45049036051](https://github.com/zyyu1/personal-workspace/actions/runs/45049036051) attempts, and successful [45050344151](https://github.com/zyyu1/personal-workspace/actions/runs/45050344151). Preserve source/attempt specifics; this is **factual disclosure**, not independent QA clearance of F-02.
5. **Request a new independent Review Only QA pass on the NEW SHA** and link this ruling, exact-head CI and all uploaded evidence; QA operator must fetch from GitHub (`PR #20`, Issue #19, evidence-only report) and **must not reuse its old `a042be2` results as automatic PASS**. At minimum re-verify F-01's twelve scenarios, frozen rows 5–10/25/28–30, Calendar/Overview/UI, historical data/identity and regressions. Report **PASS/PARTIAL/FAIL/NOT VERIFIED** with independent evidence and a new QA disposition. The independently appointed QA window is **Review Only**, no code edits/push/merge; it may publish a QA result only as a PR/Issue comment or on the evidence-only reports branch.
6. Explicitly retain unresolved **F-02 CI disclosure adjudication** and Windows/permission/browser evidence for rows **18, 29, 30**, unless independently proven later. **Even a green F-01 CI does not authorize merging PR #20**. Keep Issue #19 OPEN and PR DRAFT; final Code Acceptance and merge require new Design Window ruling.
7. **STOP after upload and QA request**, or earlier on preflight/scope/model/CI failure. No continuation into other findings or Module 010, B2B/B3, Codex Queue, scheduler/background actions.

## 6. Gate summary

**NOW AUTHORISED:** one interactive, existing-branch F-01-specific fix + comprehensive tests; normal push; one naturally triggered exact-head CI; GitHub evidence upload (PR + Issue + separate reports branch when safe); handoff to a **different** Review Only QA window.

**NOT AUTHORISED:** rewrite frozen design, schema/migration shape, unapproved date invalidation UX, unrelated feature refactor, destructive Git action, extra CI scopes, declaring product QA ACCEPTED, PR merging or Issue closure. If any required task exceeds this contract, STOP and report to Design Window with exact reasoning.

**Final release gate: F-01 FIX AUTHORIZED / IMPLEMENTATION PENDING / PR #20 DRAFT / MERGE HOLD / INDEPENDENT REVISION-01 QA REQUIRED.**
