# Personal Workspace — Module 008 Cloud Execution Operator Amendment

**Design Window v0.0.2 decision: CLOUD EXECUTION APPROVED FOR GITHUB-ONLY CLOSEOUT / ONE-TIME SCOPED ENVIRONMENT EXCEPTION.**
**Decision date:** 2026-11-22 (Europe/Berlin).
**Status at authorization:** PR #18 OPEN / UNMERGED; Issue #17 OPEN. **No merge has been performed by this amendment.**

## 1. Narrow change to execution environment

The earlier [operator handoff](./MODULE_008_OPERATOR_HANDOFF_CLAUDE.md) identifies the new executor as **Windows Claude Code Execution Window** and includes checking the Windows local worktree. Claude's actual operator session runs in an **Anthropic-hosted cloud workspace**, using a clean fresh clone at `/home/claude/personal-workspace`; it does **not** have access to or permission to execute commands on the user's Windows PC.

**Design Window expressly authorizes the active interactive Claude Code cloud session as the execution operator for the remaining GitHub-only Module 008 tasks.** The Windows-local path/clean-worktree check is **not required for this GitHub-only merge** because no host filesystem, local build artifacts, or Windows native-folder functionality is being read or changed. Its replacement is a read-only verification of the cloud clone's clean worktree, remote identity and HEAD, plus an independent authoritative GitHub API PR/head/mergeability read immediately before merge.

This amendment **supersedes only the Windows execution-location requirement** of `MODULE_008_OPERATOR_HANDOFF_CLAUDE.md` and `MODULE_008_MERGE_AUTHORIZATION.md`, solely for PR #18's approved merge and closeout. All other exact-SHA, accepted QA, merge-method, stop, historical-audit and security requirements remain intact. This is **not** authorization for remote Windows commands, host-specific QA, background agents or a standing cloud automation.

## 2. Frozen evidence and candidate

- Repository: `zyyu1/personal-workspace`.
- Authorized PR: [#18](https://github.com/zyyu1/personal-workspace/pull/18), existing branch `codex/module-008`.
- **Only authorized PR HEAD:** `d366710e51f5f4ab1cb6a10cb2919c46549afaed`.
- Independent [Revision 01 QA ACCEPTED](https://github.com/zyyu1/personal-workspace/pull/18#issuecomment-7069684532): **30 PASS / 0 PARTIAL / 0 FAIL** at that exact HEAD, including 160/160 tests.
- [Final Code Acceptance / Merge Authority](./MODULE_008_MERGE_AUTHORIZATION.md) and [Operator Handoff](./MODULE_008_OPERATOR_HANDOFF_CLAUDE.md) continue to govern.
- Original REJECTED evidence remains preserved in PR #18 and the handoff history. No fresh tests or QA are required **if and only if the accepted PR HEAD has not changed** and the resulting merge does not introduce unreviewed conflict resolutions or source changes.
- At this decision, main includes Module 007's accepted merge `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`, plus main-only documentation commits. The new documentation-only amendment does not itself change the accepted PR head.

## 3. Cloud preflight, authentication and merge

Before the one-time merge, the active Claude Code cloud execution session must:
1. Verify clean `/home/claude/personal-workspace` working tree and correct `origin`, or otherwise prove no local repository change will be overwritten. Do not pretend the Windows worktree was checked.
2. Re-fetch the live **GitHub API** PR #18 fields: OPEN, `merged=false`, current `head.sha` **exactly** `d366710e51f5f4ab1cb6a10cb2919c46549afaed`, and `mergeable=true` / `mergeable_state=clean`; verify latest `main` still includes accepted Module 007 and the main-only authoritative documents, and the combined merge would not overwrite the STATUS chronology.
3. Confirm the cloud session has a *currently functional authenticated GitHub API write-capable tool* authorized for this repository. **An invalid `gh` token is not a reason to claim success**; a read-only permission display is not proof that the write action will succeed. Do not expose secrets. GitHub branch-protection read permission `403` is **not evidence that no protection exists**; do not bypass protection.
4. If, and only if, all checks pass, perform **one normal GitHub Merge Commit** on PR #18 via the authenticated GitHub REST `PUT /repos/zyyu1/personal-workspace/pulls/18/merge`, with JSON **`sha: "d366710e51f5f4ab1cb6a10cb2919c46549afaed"`** and **`merge_method: "merge"`**. This server-enforced exact head comparison prevents accidentally merging a changed PR. Do not squash/rebase, force-push, mutate candidate branch, or use unattended auto-merge.
5. If API authentication, mergeability, head comparison, conflict or any condition fails, **STOP**, preserve the failed result, and return to Design Window; no workarounds or silent retries.

## 4. Verified post-merge closeout

After GitHub confirms an actual merge:
1. Re-read the PR via API and verify `merged=true`, `merged_at`, real merge commit SHA and the inclusion of accepted PR head in `main`. Do **not** confuse the synthetic pre-merge `merge_commit_sha` with the final recorded merge commit.
2. Re-read **current** `main` `docs/handoffs/008/STATUS.md`, append a factual **Final Merge Acceptance** section without rewriting prior historical entries. Record the accepted exact head, real merge SHA, final independent QA 30/30 and references to both original REJECTED and later ACCEPTED reports. Use the actual current GitHub blob SHA for conditional update; STOP on any conflict.
3. Publish verifiable closeout in PR #18 and Issue #17. Close Issue #17 **only after** verified merge plus successfully reconciled status document.
4. Return one factual `MODULE 008 FINAL MERGE REPORT` and **STOP**. Neither this amendment nor a successful closeout starts Module 009/010 or authorizes any B2B/B3, background service, scheduler or real Codex Queue.

## 5. Limits of this permission

This is a **one-time interactive, GitHub-only delegation** to a cloud-hosted Claude Code window to replace a Windows-hosted execution window. It does **not** transfer permissions to arbitrary new agents, remote Windows host file operations, product feature changes or new coding tasks. If a Windows-local test becomes necessary due to new evidence, STOP and request a new explicit design instruction.

**Design decision:** `CLOUD OPERATOR APPROVED / ACCEPTED HEAD LOCKED / MERGE AUTHORIZED / ACTUAL MERGE PENDING`.
