# Personal Workspace — Module 008 Final Code Acceptance & Scoped Merge Authorization

**Design Window v0.0.2 decision (2026-11-21, Europe/Berlin): CODE ACCEPTED / MERGE AUTHORIZED SUBJECT TO EXACT-SHA GATE.**

**IMPORTANT: This document is NOT a merge, a final merged-state record, a Windows command dispatch, or an authorization for Module 009/010 or automation.**

## 1. Identity and evidence

- Repository: private `zyyu1/personal-workspace`.
- Work order: [Issue #17](https://github.com/zyyu1/personal-workspace/issues/17) (still OPEN at decision).
- Implementation: [PR #18](https://github.com/zyyu1/personal-workspace/pull/18), branch `codex/module-008`, still OPEN / UNMERGED at decision.
- **Exact accepted PR candidate HEAD:** `d366710e51f5f4ab1cb6a10cb2919c46549afaed`.
- Base of PR when reviewed: `5e2849ec4e4ba0147ab8ab5051d442717171ec19` (accepted Module 007 baseline plus 008 start authority).
- Original implementation commit: `f5c5b003fe979eb5d253f075f660c771ee2c928a`.
- Original rejected candidate: `e31502bb346b38c0a559519f97b829da22c963ae`.
- Original independent QA: [REJECTED, 26 PASS / 1 PARTIAL / 3 FAIL](https://github.com/zyyu1/personal-workspace/pull/18#issuecomment-7069366299).
- Formal remediation authority: [MODULE_008_REMEDIATION_REV01.md](./MODULE_008_REMEDIATION_REV01.md) on main (commit `9867779c1bf9efe40c255540ecac28ba204c749a`).
- Revision 01 code commit: `f61fed69b352a93c3f4325ed50381bd363cbb863`.
- Final candidate includes a documentation-only handoff/status commit after code remediation; independent review anchored to the **final** `d366710...` HEAD.
- Independent Review Only QA: [Revision 01 ACCEPTED](https://github.com/zyyu1/personal-workspace/pull/18#issuecomment-7069684532) with **30 PASS / 0 PARTIAL / 0 FAIL**. All five M008-QA-001..005 **PASS / CLOSED**, no new findings.
- Independently run on accepted exact SHA: `npm run typecheck` PASS; `npm run lint` PASS (0 errors, 12 pre-existing Research warnings); `npm run build` PASS; `npm test -- --run` **160/160 PASS across 11 files**; `git diff --check` PASS.
- Independent browser QA: 1440×900, 1024×768, 390×844, no horizontal overflow, Unit/Item create→auto-open Inspector→Escape focus return, missing-denominator Overview projection with exercise/review count, IndexedDB reload, no console errors.
- Source comparison between original rejected HEAD and accepted HEAD shows two new commits touching nine files in the five defect-remediation areas plus QA handoff/status documentation; no separate module expansion identified. GitHub mergeability was `clean` at the decision-time query, **not a promise that it remains clean later**.

## 2. Design Window acceptance

**Module 008 V1.0 code and frozen 30-row QA matrix are ACCEPTED at exactly `d366710e51f5f4ab1cb6a10cb2919c46549afaed`.**

The original independent QA rejection remains historical fact and MUST NOT be rewritten as a first-try PASS. Revision 01's accepted evidence supersedes the original rejection as the current code gate only.

**MERGE AUTHORIZED** solely for PR #18's exact accepted HEAD into main, by the original interactive Windows Development Window after the user deliberately relays this instruction. Mergeability alone is insufficient. This decision does not claim that a merge has occurred.

## 3. Mandatory merge preflight and scope

Before any merge action, the interactive Development Window must:
1. Fetch/read this authority, the frozen design, the actual PR #18 and QA comments, and `main`'s current Git state. Read-only verify expected branch, clean local worktree, `git rev-parse HEAD`, exact remote PR head, PR OPEN / UNMERGED, and that the accepted Module 007 merge `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08` is in the target main ancestry.
2. Verify **remote PR #18 HEAD equals `d366710e51f5f4ab1cb6a10cb2919c46549afaed`** exactly; check no source, test, documentation, base, dependency, or commit changed after the independent QA anchor. If anything changed or unexpected commits appear, **STOP**, return to Design Window for new review; do not reuse the old QA vote.
3. Confirm normal GitHub mergeability and that merging will retain both the historical 008 STATUS audit in the PR and the new main-only remediation/merge-authorization records. No force-push, hard reset, destructive rebase or conflict resolution by silently overwriting an audit file. A new code/diff change is NOT authorized as part of this merge.
4. If checks pass, perform one **ordinary non-force merge of PR #18 into main** using the repository's accepted workflow. No auto-merge before check. If GitHub reports a conflict or changed SHA, **STOP**, do not improvise a code fix or a new QA head.

## 4. Post-merge evidence and final status

After GitHub confirms the merge, independently retrieve:
- Actual **merge commit SHA**, merged_at, final PR state, and confirmation that the accepted candidate code is included in `main`.
- `git status --short` on the local working tree if used; no hidden uncommitted changes.
- Confirm no unrelated modules/services were activated.

Then **append a new final-status section** to `docs/handoffs/008/STATUS.md` on main, preserving the entire earlier chronology (original REJECTED and Revision 01 included), stating accepted QA HEAD, independent ACCEPTED link, **30 PASS / 0 PARTIAL / 0 FAIL**, exact actual merge commit, and factual `MERGED / FINAL CODE ACCEPTED` status. Use GitHub's current blob/commit precondition to avoid overwriting concurrent changes. If STATUS update conflicts or fails, STOP and report; don't reset/overwrite.

Post verified merge evidence in Issue #17 and/or PR #18. **Issue #17 may be closed only after** a verified merged PR and status-record reconciliation; retain links to the original REJECTED QA and accepted Revision 01 QA.

Do **not** claim broader Windows native-file capability, cloud sync, automatic grading, or any Module 009/010 product functionality. This acceptance is for the frozen Module 008 scope and independently verified QA matrix; it does not grant unlimited deployment/host-specific assertions.

## 5. Prohibitions

No Module 009/010 start, no B2B (PAUSED), no B3, no real Codex Queue, no scheduler/watcher/service/daemon or unattended dispatch, no backend replacement or unrelated source edits. If merge-state/sha/ownership/branch safety cannot be established, **STOP** for Design Window adjudication.

**Next step:** User-initiated, bounded merge execution using this authority. Until the real merge commit and closeout evidence are posted, the factual state is **CODE ACCEPTED / MERGE AUTHORIZED / PR STILL UNMERGED**.
