# Module 009 — F-01 Revision 01 Developer Evidence (evidence only; not independent QA)

- **Authority:** [`F01_CODE_REMEDIATION_EXECUTION_AUTHORIZATION.md`](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/009/F01_CODE_REMEDIATION_EXECUTION_AUTHORIZATION.md) + ruling [`F01_LEGACY_VERIFIED_CALENDAR_PRESERVATION_RULING.md`](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/009/F01_LEGACY_VERIFIED_CALENDAR_PRESERVATION_RULING.md) (main `b8742a6`, `2f9d957`)
- **PR:** [#20](https://github.com/zyyu1/personal-workspace/pull/20) — OPEN / **DRAFT** / unmerged. **Issue:** [#19](https://github.com/zyyu1/personal-workspace/issues/19) OPEN.
- **New candidate HEAD:** `25706850673cd4f08f751b5554757caa7525076f`
- **Parent (previous QA anchor):** `a042be2304bee7ef56678d719ea3a09999a95cce`
- **Exact-head CI:** [run 45055399240](https://github.com/zyyu1/personal-workspace/actions/runs/45055399240), attempt 1, tested SHA `25706850673cd4f08f751b5554757caa7525076f`, **success** (no rerun)
- **Executor:** Claude Code cloud Development / Execution Window (no Windows host access). Commit author yu ziyi. Normal push, no force/rebase/reset.

## 1. Preflight (all passed)

Origin `zyyu1/personal-workspace`; clean worktree on `codex/module-009`; PR #20 OPEN/DRAFT/UNMERGED at exactly `a042be2`; Issue #19 OPEN; push permission present; 007 `cd2c714` and 008 `48558a8` in ancestry; no active CI run; main read (`2f9d957`) **without** merging it into the branch.

## 2. Root cause and rule implemented

**Root cause (QA F-01, upheld):** `globalCalendarService` added any active `exam` milestone to the "replace legacy" set *before* checking Calendar eligibility, so an `unverified`/`unknown` milestone hid the verified 007 event without projecting anything. `ExamsView` and Overview showed only the tentative date.

**Fix:** one shared, read-only resolver `resolveExamDate(assessment, milestones)` in `studyExamService.ts`, derived from **existing v3 history** (milestones are append-only; `createdAt`, `status`, `updatedAt` at cancellation). **No change to `types.ts`, schema version, migration, or stored data.**

Replay, in creation order with cancellations at their `updatedAt`, starting from verified 007 legacy evidence (`verified && valid officialDateTime`):
- dated `user-confirmed` / `source-verified` milestone → becomes the **effective** date, clears any pending proposal;
- `unverified` or `unknown` milestone → becomes the **pending** proposal only (never revokes confirmed evidence);
- cancelling the effective confirmed milestone → **no** effective date (older confirmation or legacy is **not** resurrected);
- cancelling the pending proposal → clears it, effective date kept;
- assessment `cancelled` / `archived` → no Calendar event; all records kept.

Output: `effective` (legacy | milestone), `pending`, `reviewNeeded = effective && pending`, `onCalendar`, `effectiveWithdrawn`.

**Consumers (all use the same resolver):**
- **Calendar** (`globalCalendarService.ts`): at most one `assessment-deadline` event, id `calendar-assessment:<assessmentId>`, `canonicalSourceId=<assessmentId>`. Legacy projection unchanged (date/time/zone/provenance, `verification:'verified'`, `precision:'exact'`, Overview route) unless a proposal is pending; then adds `reviewNeeded:true`, `pendingProposal` text and routes to `/study/courses/<offering>/exams?assessment=<id>`. Registration/withdrawal milestones unchanged.
- **Calendar page** (`GlobalCalendarPage.tsx`): `role="note"` warning "Previously verified · Reconfirmation needed — A newer tentative exam date exists (…). Check both dates in Exams." (or "Previously confirmed" for a user-confirmed date). Verification value is not changed.
- **Exams** (`ExamsView.tsx`): card shows projected date + "On Calendar", "Newer tentative date: …", "Reconfirmation needed"; inspector "Projected exam date / Newer tentative proposal" status block with accessible warning; milestone list labels the projected confirmed milestone and the pending proposal; **save-time warning** for `exam` + `unverified`/`unknown` when a confirmed date exists.
- **Overview** (`CourseWorkspace.tsx`): same resolution; "… · on Calendar" when confirmed evidence is projected; "Reconfirmation needed. Newer tentative date: … — not on Calendar"; no "Tentative · not on Calendar" while a fallback is projected.

## 3. Changed files (exact)

| File | + / − | Change |
|---|---|---|
| `src/features/study/services/studyExamService.ts` | +34 / −2 | `resolveExamDate` resolver; summary uses it |
| `src/services/globalCalendarService.ts` | +27 / −13 | resolver-based exam projection; `reviewNeeded`, `pendingProposal` |
| `src/features/study/components/ExamsView.tsx` | +21 / −10 | card / inspector status / save-time warning |
| `src/features/study/components/CourseWorkspace.tsx` | +6 / −3 | Overview card |
| `src/components/GlobalCalendarPage.tsx` | +1 / −1 | warning note |
| `src/styles.css` | +2 / −0 | warning styles |
| `src/features/study/StudyExams.test.tsx` | +134 / −1 | +16 tests |

Total `7 files changed, 225 insertions(+), 30 deletions(-)`. All within the authorization allow-list. Not touched: `types.ts`, repository/migration, 007/008 code, global Task/Timer/Resource, `package.json`, lockfile, workflow, browser-smoke script, `Study.test.tsx`.

## 4. CI at `2570685` (run 45055399240)

| Step | Result |
|---|---|
| npm ci (committed lockfile) | success |
| typecheck | success |
| lint | success — 0 errors, 12 pre-existing Research warnings (no new) |
| build | success |
| tests | success — **12 files, 202/202** (186 previous + 16 F-01); `StudyExams.test.tsx` 42/42 |
| `git diff --check origin/main...HEAD` | success |
| browser smoke (cloud Chrome 157, Linux) | success — 0 failures; 15/15 Escape-focus cycles restored, max 26 ms, 0 > 250 ms; immediate observation `body` 15/15; 0 console errors (default `/favicon.ico` 404 reported separately) |

Node 24 (on Node 22, current main fails 3 pre-existing ZIP tests). The default vitest reporter prints per-file counts only; individual F-01 test names below are from the source, all inside the passing 42/42 file.

## 5. F01-01 … F01-12 test mapping (`describe('Module 009 F-01 Revision 01 — …')`)

| Case | Test name | Result |
|---|---|---|
| F01-01 | `F01-01 legacy verified exam without milestones keeps exactly one original event` | pass |
| F01-02 | `F01-02 unverified date-only proposal keeps the old event and flags reconfirmation` | pass |
| F01-03 | `F01-03 unverified exact proposal keeps the old event with its original timezone, no promotion` | pass |
| F01-04 | `F01-04 unknown proposal keeps the old event and invents no time` | pass |
| F01-05 | `F01-05 user-confirmed date-only replacement gives exactly one all-day event; legacy stays readable` | pass |
| F01-06 | `F01-06 source-verified exact replacement gives exactly one exact event with local time, zone and instant` | pass |
| F01-07 | `F01-07 without previously confirmed evidence, tentative exact/date-only/unknown create no exam event` | pass |
| F01-08 | `F01-08 cancelling the pending proposal clears the warning and keeps the old event unchanged` | pass |
| F01-09 | `F01-09 cancelling or archiving the assessment removes the exam event and keeps all evidence` | pass |
| F01-10 | `F01-10 a later unverified proposal keeps the last confirmed milestone, not the obsolete legacy date` | pass |
| F01-11 | `F01-11 a newer confirmed replacement wins; cancelling it resurrects neither the older confirmation nor legacy` | pass |
| F01-12 | `F01-12 identity is stable after reload, never leaks across offerings, and same-day records stay one event` | pass |
| UX | `Exams card and inspector show both dates, the projected one, and an accessible warning` | pass |
| UX | `warns before saving a tentative exam date when a confirmed date exists, and not for a confirmed save` | pass |
| UX | `Overview agrees with Calendar: confirmed fallback is on Calendar and the tentative date is flagged` | pass |
| UX | `Calendar page shows the reconfirmation warning on the single preserved event without upgrading provenance` | pass |

All 26 earlier Module 009 tests and all 160 earlier 001–008 tests still pass, with no assertions relaxed. The browser smoke has no F-01-specific scenario; F-01 UI evidence comes from jsdom component tests.

## 6. Complete CI chronology for PR #20 (F-02 disclosure; every run on the branch)

| Run | Attempt | Head | Conclusion | What happened |
|---|---|---|---|---|
| [45045784496](https://github.com/zyyu1/personal-workspace/actions/runs/45045784496) | 1 | `d131025` (CI workflow only, baseline main code) | **failure** | Node 22: 3 pre-existing ZIP manifest tests failed (157/160). *Previously omitted from the "complete history".* |
| [45045970624](https://github.com/zyyu1/personal-workspace/actions/runs/45045970624) | 1 | `7a20b48` | **failure** | Node 22/24 matrix: Node 22 same 3 failures, Node 24 160/160 pass → CI pinned to Node 24 |
| [45046822507](https://github.com/zyyu1/personal-workspace/actions/runs/45046822507) | 1 | `f53fa04` | success | implementation, existing tests |
| [45047090026](https://github.com/zyyu1/personal-workspace/actions/runs/45047090026) | 1 | `ecae008` | success | + 26 Module 009 tests (186/186) |
| [45047256878](https://github.com/zyyu1/personal-workspace/actions/runs/45047256878) | 1 | `bcdb26d` | **failure** | first browser smoke: 4 failures — 3 route checks (CSS-uppercased eyebrow vs case-sensitive `innerText`) and 1 console error (default `/favicon.ico` 404). Next commit made the route check case-insensitive and moved only the `/favicon.ico` 404 to "reported, not failed". *Previously omitted.* |
| [45047487262](https://github.com/zyyu1/personal-workspace/actions/runs/45047487262) | 1 | `ed1c409` | success | |
| — | — | `845c825` | no run | docs-only commit while PR conflicted with main |
| [45049036051](https://github.com/zyyu1/personal-workspace/actions/runs/45049036051/job/137289855375) | 1 | `b9fd763` (main→branch merge) | **failure** | smoke 16/17: 1440×900 Escape focus `focusLabel=null` |
| [45049036051](https://github.com/zyyu1/personal-workspace/actions/runs/45049036051/job/137291827988) | 2 | `b9fd763` | **failure** | authorized single rerun: 1024×768 Escape focus `focusLabel=null` |
| [45050344151](https://github.com/zyyu1/personal-workspace/actions/runs/45050344151) | 1 | `a042be2` | success | instrumented focus diagnostics, 15/15 |
| [45055399240](https://github.com/zyyu1/personal-workspace/actions/runs/45055399240) | 1 | **`2570685`** | **success** | this F-01 revision |

This is factual disclosure; adjudication of F-02 remains with Design Window / independent QA.

## 7. Open items (F-01 only was addressed)

1. **Explicit invalidation not available (by ruling):** when the projected confirmed date is a milestone already superseded by a pending proposal, the user cannot withdraw that confirmed date without a replacement; only the pending proposal can be cancelled. A "withdraw previous confirmation" action needs a separate design decision.
2. Unresolved and not addressed here: **F-02** adjudication; **rows 18, 29, 30** (Windows host, native file permission, real-browser permission-required / another-device / missing Resource flows); **F-03** transient `body` focus and screen-reader impact; **F-04** past legacy exam still listed as upcoming; **F-05** local "Available" paper with Open disabled and no explanation; **F-07** smoke `checks` counts log rows, not assertions.
3. Browser evidence is cloud Linux headless Chrome only; it is **not** Windows validation, and the smoke has no F-01 scenario.
4. Developer self-check of the 30 frozen rows is **not re-scored** here; the previous independent result (26 PASS / 4 PARTIAL / 0 FAIL at `a042be2`) does **not** carry over to `2570685`.

## 8. Requested independent Review Only QA (new SHA)

Re-verify at exactly `25706850673cd4f08f751b5554757caa7525076f` — do not reuse `a042be2` results: F01-01…12, frozen rows 5–10, 25, 28–30, Calendar/Overview/Exams consistency in a real browser, historical data/identity, and regressions. Report PASS / PARTIAL / FAIL / NOT VERIFIED with independent evidence. Review Only: no code edits, push or merge.

**Developer evidence only. No independent QA acceptance claimed. PR #20 stays DRAFT; merge not authorized; Issue #19 stays open.**
