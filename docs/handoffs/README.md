# Personal Workspace — GitHub Shared Handoffs

This directory is the durable handoff channel shared by the Design, Development, and QA windows. GitHub stores the approved instructions, implementation evidence, and independent QA result; it does not itself enforce role permissions.

## Roles

### Design Window

- Confirms product requirements and architecture decisions.
- Publishes the frozen `DESIGN_APPROVED.md` and the authoritative `EXECUTION_INSTRUCTION.md`.
- Evaluates independent QA results and authorizes the next stage.

### Development Window

- Reads the approved handoff before implementation.
- Implements only the approved scope and does not silently edit an approved design.
- Reports the implementation commit, changed files, diff summary, test results, known limitations, and QA handoff.

### QA Window

- Reviews and tests the actual implementation independently under the Review Only rule.
- Does not directly change business code during review.
- Returns `PASS`, `PARTIAL`, or `FAIL` plus the final acceptance decision.
- May publish results in the matching pull request, issue, or module handoff directory.

If QA does not pass, the Design Window defines the repair scope before work returns to the Development Window.

## Handoff Rules

1. Each module uses a zero-padded directory such as `007/`, `008/`, or `009/`.
2. `DESIGN_APPROVED.md` is copied verbatim from the frozen approved design. History notes remain unchanged.
3. `EXECUTION_INSTRUCTION.md` contains the complete authoritative implementation instruction.
4. `STATUS.md` is the current operational state and must never claim implementation or QA completion early.
5. Development completion adds a separate QA handoff containing the implementation SHA, changed files, approved-design coverage, acceptance checks, verification results, import-safety results, limitations, and review risks.
6. QA results should be attached to the corresponding pull request or issue when possible.

## File Naming

- Frozen design: `DESIGN_APPROVED.md`
- Implementation authorization: `EXECUTION_INSTRUCTION.md`
- Current module state: `STATUS.md`
- Development-to-QA report: `QA_HANDOFF.md`
- Independent QA report: `QA_REPORT.md`

Do not overwrite historical handoffs. Add a clearly versioned amendment or a new module/revision directory when a frozen decision changes.

## Git Workflow

- `main` contains accepted source baselines and formal handoff documents.
- Module 007 development uses `codex/module-007`.
- Later modules use their own `codex/module-NNN` branches.
- Development is reviewed through a pull request before acceptance into `main`.
- Never force-push shared history or bypass branch protection.
- Handoff-only changes may be committed directly to `main` only while it is unprotected and the change is limited to formal documentation or repository safety configuration.

Git folders do not provide access control. Branch protection, required pull-request reviews, and `CODEOWNERS` should be configured if enforcement is required.

## QA Flow

1. Design publishes the approved design and execution instruction.
2. Development implements on the module branch and publishes a QA handoff.
3. QA independently checks code, tests, build output, acceptance criteria, and disclosed risks.
4. Design evaluates QA's decision and either accepts, defines remediation, or authorizes the next module.

Only independent QA and the Design Window may advance the module beyond implementation review.
