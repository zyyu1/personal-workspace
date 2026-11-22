# Personal Workspace — Module 008 Execution Operator Handoff

**Decision date:** 2026-11-22 (Europe/Berlin)
**Status:** **EXECUTION OPERATOR HANDOFF APPROVED / MERGE NOT YET EXECUTED**

This record supplements, and does not replace, [`MODULE_008_MERGE_AUTHORIZATION.md`](./MODULE_008_MERGE_AUTHORIZATION.md). All exact-SHA, safety, audit-preservation, merge, status-reconciliation, and stop conditions in that authorization remain fully effective.

## 1. Operator change

- **Previous execution operator:** Windows Codex Development Window.
- **New execution operator:** Windows Claude Code Execution Window.
- **Effective scope:** only the already-authorized ordinary merge of PR [#18](https://github.com/zyyu1/personal-workspace/pull/18), the factual Module 008 status update after a verified merge, and the final closeout of Issue [#17](https://github.com/zyyu1/personal-workspace/issues/17).
- The previous Codex execution window must not execute the Module 008 merge after this handoff.

This operator change does not authorize new implementation, remediation, refactoring, testing changes, dependency changes, or product scope.

## 2. Accepted identity remains unchanged

- Independent Review Only QA: **ACCEPTED**.
- Frozen acceptance matrix: **30 PASS / 0 PARTIAL / 0 FAIL**.
- Exact accepted PR candidate HEAD: `d366710e51f5f4ab1cb6a10cb2919c46549afaed`.
- Accepted QA evidence: [PR #18 independent QA report](https://github.com/zyyu1/personal-workspace/pull/18#issuecomment-7069684532).
- Formal merge authority: [`MODULE_008_MERGE_AUTHORIZATION.md`](./MODULE_008_MERGE_AUTHORIZATION.md), published on main in commit `e6cdf81d62a97daecf7282733fccbe2dab42f199`.
- PR #18 remains unmerged at the time this handoff record is created.

The handoff does not transport acceptance to any changed SHA. Any new PR commit, source/test/documentation diff on the candidate branch, base change requiring conflict resolution, or other identity mismatch invalidates the existing merge gate and requires a STOP plus renewed review.

## 3. Mandatory Claude Code read-only preflight

The Windows Claude Code Execution Window must begin with read-only verification before any merge action:

1. Fetch and completely read this handoff, `MODULE_008_MERGE_AUTHORIZATION.md`, the frozen Module 008 design, `STATUS.md`, Issue #17, PR #18, the original rejected QA record, and the accepted Revision 01 QA report.
2. Verify the local worktree is clean and no user or other-window changes could be overwritten.
3. Verify PR #18 is OPEN and UNMERGED, and its remote HEAD is exactly `d366710e51f5f4ab1cb6a10cb2919c46549afaed`.
4. Verify the accepted Module 007 merge `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08` is in the target main ancestry.
5. Verify normal GitHub mergeability and inspect the actual merge diff so the PR chronology and main-only authorization/handoff records will all be retained.
6. Verify that no source, test, dependency, base, documentation, or commit change has appeared since the accepted QA anchor.

Only if every preflight gate passes may the new operator perform the single ordinary, non-force merge authorized by the original merge authorization.

## 4. Stop conditions

The new operator must immediately **STOP** and return evidence to the Design Window if any of the following occurs:

- PR HEAD or accepted SHA mismatch.
- Merge conflict, non-clean mergeability, unexpected diff, unexpected commit, or base-history discrepancy.
- Missing repository permission, authentication failure, branch-protection issue, or inability to verify the actual remote state.
- Dirty local worktree or risk of overwriting another window's work.
- Any need to edit source, tests, dependencies, frozen design, or the accepted candidate to complete the merge.
- Any failure while appending the factual final status or reconciling the chronological audit trail.

No force push, hard reset, destructive rebase, silent conflict resolution, or audit-history overwrite is permitted.

## 5. Post-merge closeout boundary

After GitHub confirms a successful merge, the new operator must follow the original authorization exactly:

- Retrieve and record the actual merge commit SHA, merged state, and `merged_at` value.
- Verify the accepted candidate is contained in main and no unrelated module or service was activated.
- Append the final Module 008 chronology to `STATUS.md` without deleting or rewriting the original rejection and Revision 01 acceptance history.
- Publish factual merge/status evidence to PR #18 and Issue #17.
- Close Issue #17 only after the merge and status reconciliation are both verified.

## 6. Explicit exclusions

This handoff does **not** authorize Module 009/010, B2B/B3, real Codex Queue, background watchers, daemons, services, schedulers, unattended dispatch, backend replacement, cloud synchronization, or unrelated repository work.

**Current factual state:** Module 008 code accepted at the exact SHA above; merge authorized under the existing strict gates; PR #18 still unmerged; execution ownership transferred from Windows Codex Development Window to Windows Claude Code Execution Window.
