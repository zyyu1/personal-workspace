# Module 007 Remediation Revision 01 — QA Handoff

## Candidate

- Branch: `codex/module-007`
- Remediation base: `7a670f77848e752855dd277c7e9af5850b4006f2`
- PR: https://github.com/zyyu1/personal-workspace/pull/15
- Authority: `docs/handoffs/007/MODULE_007_REMEDIATION_REV01.md` on `origin/main`
- Scope: M007-QA-001 through M007-QA-005 only
- QA mode: Review Only; do not modify or merge the candidate

The exact candidate HEAD is posted to PR #15 after this handoff and the remediation commit are pushed.

## Remediation summary

| Issue | Result | Implementation evidence |
| --- | --- | --- |
| M007-QA-001 | FIXED | `StudyCourseService.unlinkResource` validates Offering ownership and mutates only entries belonging to that Offering's source IDs. Shared Resource, other Offering entries/links and progress remain intact. |
| M007-QA-002 | FIXED | Manifest reconciliation deduplicates all incoming paths (including rejected paths and directories), reuses stable Entry IDs, handles safe/rejected/missing transitions, and preserves prior available rows on partial Resource write failure. |
| M007-QA-003 | FIXED | Global Calendar project selector loads canonical CourseOfferings, exposes `assessment-deadline`, queries Study without Research Planning/Submission assumptions, and projects only verified dated assessments. |
| M007-QA-004 | FIXED | Shared area-aware route helpers send Study project links to Course Overview and Study resource links to Course Materials; Research routes are unchanged. Task Inspector copy and stage label are area aware. |
| M007-QA-005 | FIXED | Mobile timer keeps Pause/Resume, Finish & save and Discard visible. Import wizard is viewport-fixed, Escape-safe while idle, focuses Close, and restores the actual launch control. |

No new Task, Resource, Calendar, Timer, TimeEntry or Study domain store was introduced. IndexedDB/versioned repository behavior and ZIP safety bounds remain unchanged.

## Regression coverage

`src/features/study/Study.test.tsx` now contains 33 tests. Revision 01 adds:

1. shared canonical Resource across Winter/Summer Offerings; unlink one and persist the other link/progress;
2. imported Resource in one Offering plus manual link in another;
3. repeated/reordered manifest reconciliation and rejected → safe / safe → rejected / removed → missing transitions with stable IDs;
4. partial Resource upsert diagnostic with prior row preservation;
5. verified Study assessment Calendar query and safe canonical route;
6. Calendar UI CourseOffering/source selector;
7. area-aware Study and Research project/resource routing, including rendered Global Tasks and Task Inspector links;
8. material wizard Escape close and launch-focus restoration.
9. stale Calendar response suppression after project changes;
10. modal focus retention across asynchronous Resource loading rerenders.

Existing traversal, drive/UNC, symlink, ZIP-bomb ratio, index-only, IndexedDB/canonical identity and modules 001–006 regression tests remain in the full suite.

## Command evidence

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS, 0 errors; 12 pre-existing warnings in modules 001–006 |
| `npm run build` | PASS; production chunks generated |
| `npm test -- --run` | PASS, 10 files / 137 tests |
| `npm test -- --run src/features/study/Study.test.tsx` | PASS, 33/33 |
| `git diff --check` | PASS; Git CRLF notices only |

## Browser evidence

- Active timer at the mobile breakpoint exposes visible `Pause`, `Finish & save` and `Discard` controls; measured button rectangles are inside the fixed timer.
- Material wizard measured exactly to the effective viewport bounds, did not exceed the viewport, closed with Escape and restored focus to `Add / refresh materials`.
- Effective 787px and 1107px browser surfaces reported no horizontal document overflow.
- The in-app browser constrained requested 390/1024/1440 viewports to smaller effective sizes. Exact-dimension screenshot certification remains an independent QA task and is not claimed as complete E2E evidence.
- A real Windows directory picker was not authorized or exercised. Acceptance item 4 remains PARTIAL.

## 24-item acceptance matrix

| # | Result | Evidence / limitation |
| ---: | --- | --- |
| 1 | PASS | Course and term-specific CourseOffering identities remain separate. |
| 2 | PASS | Course Overview reads canonical Study, Resource, Task and Time data. |
| 3 | PASS | Unknown ECTS/date/progress states remain explicit. |
| 4 | PARTIAL | Explicit handle fixture passes; no genuine Windows picker evidence. |
| 5 | PASS | Unsupported picker, permission and managed-storage states are explicit. |
| 6 | PASS | Real in-memory zip.js central-directory preview remains covered. |
| 7 | PASS | Preview and explicit Confirm remain required; no extraction/upload. |
| 8 | PASS | ZIP traversal, symlink and compression-ratio protections remain green. |
| 9 | PASS | All incoming paths reconcile once per source/path with stable identity. |
| 10 | PASS | Manual classification persists across reorder/rescan. |
| 11 | PASS | Past-paper filenames do not create assessments. |
| 12 | PASS | Shared canonical Resource survives cross-Offering unlink. |
| 13 | PASS | Repeated/reordered imports do not duplicate Resource/Entry. |
| 14 | PASS | Removed paths become missing; other Offering links/progress persist. |
| 15 | PASS | Metadata sync and device byte availability stay distinct. |
| 16 | PASS | Open Original remains guarded by Global Resource capability. |
| 17 | PASS | Study tasks retain canonical Global Task IDs. |
| 18 | PASS | Verified dated assessments reach Calendar once; unverified do not. |
| 19 | PASS | Study Resume remains opt-in and does not start Timer. |
| 20 | PASS | Import path still has no extraction/execution API. |
| 21 | PASS | Rejected paths and partial upsert failures retain truthful diagnostics. |
| 22 | PARTIAL | Mobile behavior and effective-width overflow checks pass; exact 1440/1024/390 capture remains for independent QA. |
| 23 | PASS | Typecheck, lint, build, 137 tests and diff check pass. |
| 24 | PASS | Scope limited to Revision 01; Module 008/B2B/B3/Queue untouched. |

## Independent QA focus

1. Reproduce all five original defects against base `7a670f7`, then verify the candidate fixes.
2. Inspect cross-Offering unlink with imported/manual combinations and reload persistence.
3. Exercise manifest repeat/reorder and every status transition; assert one Entry per source/path.
4. Verify Study Calendar selection, verified-only assessment inclusion, Research Calendar regression, and loading/error/empty states.
5. Verify rendered Global Tasks and Task Inspector routes for Study and Research.
6. Capture exact 390×844, 1024 and 1440 layouts; confirm timer Finish/Discard and wizard focus behavior.
7. Keep real Windows directory authorization PARTIAL unless genuine disposable-folder evidence is obtained.
8. Re-run the full suite and return `ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE`.

## Known limitations

- No Local Connector, Managed Storage, LMS connector, cloud sync or persistent browser file handle.
- Cross-repository ResourceLink + Study Entry writes are not one atomic transaction, consistent with the documented A01 adapter limitation.
- Directory enumeration and ZIP central-directory parsing still run on the UI thread within configured safety bounds.
