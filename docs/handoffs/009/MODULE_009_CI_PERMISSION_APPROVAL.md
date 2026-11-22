# Personal Workspace — Module 009 Scoped CI Permission Approval

**Decision:** APPROVED — MODULE 009 CI CONFIGURATION AND TEST EXECUTION ONLY.  
**Approver:** User, recorded by Design Window v0.0.2.  
**Date:** 2026-11-22 (Europe/Berlin).  
**Implementation issue:** [#19](https://github.com/zyyu1/personal-workspace/issues/19).  
**Project:** `zyyu1/personal-workspace`.  
**Existing frozen design:** [DESIGN_APPROVED.md](./DESIGN_APPROVED.md).  
**Separate code-start gate:** [MODULE_009_START_AUTHORIZATION.md](./MODULE_009_START_AUTHORIZATION.md).  

## 1. Authorization and permitted scope

User explicitly approved the executing window's request for **CI permission** for Module 009. At the time of this record, the linked Issue #19 did not contain the detailed request and main contained no `.github/workflows/` CI file. Therefore this approval is intentionally **narrow** and **does not claim** that any broader requested permissions, GitHub settings or Actions secrets have been enabled.

The user-initiated interactive Module 009 Claude Code Development Window may:

1. Create one minimal GitHub Actions workflow scoped to **Module 009's implementation PR** from `codex/module-009` into `main`, e.g. `.github/workflows/module-009-ci.yml`. Verify the real branch naming and HEAD before use.
2. Use a hosted CI runner to check the **existing application**: `npm ci` (respect committed lockfile), `npm run typecheck`, `npm run lint`, `npm run build`, `npm test -- --run`, and `git diff --check` where an appropriate baseline is available. Report exact actual exits and test counts.
3. Use official vetted actions such as checkout/setup-node with maintained, verified versions; pin action revisions where practical. No unreviewed third-party automation/actions.
4. Keep workflow token permission **minimum `contents: read`**, with read-only PR context, no secret use. Avoid `pull_request_target`, `workflow_run`, secret injection, write scopes and fork PR trust escalation.
5. Use a `pull_request` event and a **job-level guard** that checks `github.head_ref == 'codex/module-009'` and the intended repository; note that `pull_request.branches: [main]` filters the *base*, not the PR head. Do not enable unrelated existing PRs such as B2B.
6. Inspect CI results and disclose warnings/failures. Necessary ordinary CI workflow fixes on the isolated Module 009 branch are in scope only if they do not widen permissions, trigger boundaries, dependencies or application behavior.

## 2. Conditions and explicit exclusions

- **No automatic merge** (including auto-merge/merge queue), no branch-protection/ruleset changes, no repository organization settings changes, no secret creation/reading, no personal token management or exposure.
- No deployment, upload of private data, remote Windows command, filesystem/folder scanning outside checkout, cloud sync, job that registers an exam, or any cron/scheduled/long-running agent.
- No workflows or automation for Module 010, B2B/B3, Codex Queue or other workstreams.
- No use of `pull_request_target`, broad `permissions: write-all`, self-hosted runners, arbitrary code from external PRs with write credentials, or nested workflow invocation.
- If enabling Actions at repository level, changing account-level permissions, granting `workflows` write permission, or adding secrets is required, **STOP and seek separate explicit user approval**. This document records permission to *request normal CI workflow changes*, not the ability to grant missing GitHub App/OAuth scopes.
- A GitHub permission dialog in the Claude client still needs the user to approve it directly if the host requires explicit confirmation; the GitHub document cannot impersonate that UI approval or alter the host capability.
- Existing Module 009 development scope, clean-worktree checks, accepted 007/008 ancestry, migration requirements, 30-row frozen acceptance matrix and independent Review Only QA remain unchanged.

## 3. Evidence required in development handoff

The executing window should report:
- Workflow file path, exact workflow commit SHA and the repository PR URL.
- Workflow event filter/job guard and token permissions.
- Run ID/link, actual CI conclusion, checks and exact test counts.
- Difference between the automated CI result and any separately performed real-browser/Windows host QA (CI never substitutes for the latter).
- Any failed actions, permission denials or required user-level enabling as STOP conditions, with no hidden bypass.

**Current decision:** CI PERMISSION APPROVED (SCOPED) / WORKFLOW NOT YET CREATED OR VALIDATED / MODULE 009 MERGE HOLD / INDEPENDENT QA REQUIRED.

This record is an **addendum** to the development-start authorization, not a replacement for the frozen design or a new PR merge authorization.
