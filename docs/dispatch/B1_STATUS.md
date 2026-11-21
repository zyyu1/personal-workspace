# Dispatch B1 Status

- **Name:** Windows GitHub Issues Inbox — Read-Only / Dry-Run Classifier
- **Phase:** B1
- **Design Window Authorization:** APPROVED (2026-11-21)
- **Implementation:** MERGED INTO `main` — **code accepted**, not running automatically
- **Independent QA:** **ACCEPTED FOR B1 CODE** — Revision 01, PR #5, 18 PASS / 2 PARTIAL / 0 FAIL
- **Original QA:** REJECTED on candidate `95ad61fa9fab308cb7a87c7d30929f448779874d`, 3 High findings
- **Remediation Commit:** `7a6710fde4d972e4ba4fbff3ab3ff62f21c891ce`
- **Accepted Candidate HEAD:** `436e8626669f4dd7115dbb7bb4cb9b10a37b408a`
- **Merge Commit:** `5d52956aca82d218d9c27efb7474dc7ce7f2a91b`
- **PR:** https://github.com/zyyu1/personal-workspace/pull/5
- **Independent QA Evidence:** https://github.com/zyyu1/personal-workspace/pull/5#issuecomment-7062676473
- **Design Window Final Acceptance:** https://github.com/zyyu1/personal-workspace/pull/5#issuecomment-7062755576
- **B0 Probe:** ACCEPTED; report archived in https://github.com/zyyu1/personal-workspace/issues/3
- **Authoritative B1 Instruction:** `docs/dispatch/B1_EXECUTION_INSTRUCTION.md`
- **Remediation Instruction:** `docs/dispatch/B1_REMEDIATION_REV01.md` (historical record, no further remediation currently authorized)
- **Planning Reference:** Draft PR #2 (`design/windows-codex-dispatch-v1`), conceptual B2/B3 **NOT authorized**
- **Scope:** Operator-invoked Python `--once --dry-run` read-only GitHub Issues classifier and strict gates only, under `tools/dispatch-inbox/`
- **Remediation Findings:** B1-QA-001, B1-QA-002, B1-QA-003 independently CLOSED; no new blocking code issue identified
- **Test Evidence:** B1 40/40 PASS, existing 104/104 PASS; typecheck/build/compile PASS; lint 0 errors and 12 historical warnings
- **Windows Host Verification:** **PASS (2026-11-21, Revision 02; B1 OPERATIONAL GATE ACCEPTED)** — Windows 10 Pro, Python 3.13.2, preferred encoding `cp936`, official GitHub CLI `2.105.0`, authenticated private GET PASS. One controlled real `--once --dry-run --no-receipts` poll exited **0**, ordinary Issue #4 classified `REJECTED_UNTRUSTED / APPROVAL_LABEL_MISSING` as expected; working tree clean, no encoding workaround, no receipts, Codex calls, poller GitHub writes or service. Evidence: https://github.com/zyyu1/personal-workspace/issues/4#issuecomment-7063375466; Design Window acceptance: https://github.com/zyyu1/personal-workspace/issues/4#issuecomment-7063391810. Previous Revision 01 host FAIL is preserved in Issue #4 history.
- **B1 Automatic Operation:** NOT ENABLED — code merger does not install, schedule or run a listener on Windows
- **B2:** DESIGN APPROVED (2026-11-21) — scoped **B2A CODE-ONLY development and independent QA** authorized via `docs/dispatch/B2A_EXECUTION_INSTRUCTION.md`. **Real Codex queue delivery, B2B unattended polling and all B3 implementation routing remain BLOCKED / NOT AUTHORIZED** until separate gates. Current authoritative status: `docs/dispatch/B2_STATUS.md`.
- **B3:** BLOCKED — requires additional authorization and actual authenticated delivery/ACK controls
- **Module 007:** Existing independent implementation QA acceptance not recorded by this B1 activity; no Module 007 code work authorized by B1
- **Module 008:** NOT STARTED / BLOCKED BY MODULE 007 independently QA-accepted implementation
- **Revision 02:** **CODE QA ACCEPTED / MERGED** — PR #6 candidate `4926d31befd814be6392498c167529d2a6b2241a`, merge `fad4bfb94d685111694c341fc4be10556de339f4`; independent QA 12/12 PASS, B1 Python tests 47/47 PASS, workspace tests 104/104 PASS. Windows real retest NOT YET RUN.
- **Next Action:** B1 work is complete; do not rerun the already completed one-time smoke or enable an automatic listener. Await explicit future B2 design authorization; Module 008 remains blocked until Module 007 independent QA acceptance.

**Security boundary:** Accepting and merging B1 code does **not** authorize executing remote instructions, sending `codex queue`, starting background services/Task Scheduler, writing to GitHub from the poller, merging future modules, or activating B2/B3. The initial B0 probe verified targeted delivery, not unattended dispatch.

## Revision 02 merge and host retest authorization (2026-11-21)

- **Revision 02 PR / QA:** https://github.com/zyyu1/personal-workspace/pull/6 and https://github.com/zyyu1/personal-workspace/pull/6#issuecomment-7063189705
- **Design Window Acceptance:** https://github.com/zyyu1/personal-workspace/pull/6#issuecomment-7063318650
- **Merge commit:** `fad4bfb94d685111694c341fc4be10556de339f4`
- **Host Retry Instruction:** `docs/dispatch/B1_WINDOWS_HOST_SMOKE_REV02.md`
- **Operational Result:** **PASS — verified by Design Window**, Issue #4 comment `7063391810`, after one real cp936 Windows read-only poll. Previous FAIL remains as historical evidence in Issue #4.
- **B2/B3:** NOT AUTHORIZED.

## Revision 02 Windows Host Retest — Final Acceptance (2026-11-21)

- **Host:** Windows 10 Pro 22H2, Python 3.13.2, `gh` 2.105.0, `cp936` preferred encoding; no UTF-8 environment workaround
- **Verified main HEAD:** `217ab6130a8c69e13d2ee62b5d6e4774d0e822f8`; Revision 02 merge `fad4bfb94d685111694c341fc4be10556de339f4` is an ancestor
- **Read-only GitHub private GET:** PASS
- **Single dry-run command:** `py -3.13 tools/dispatch-inbox/dispatch_inbox.py --once --dry-run --no-receipts`
- **Exit / classification:** `0`; `REJECTED_UNTRUSTED / APPROVAL_LABEL_MISSING` (ordinary issue, expected and safe)
- **Safety:** No codepage workaround, project changes, GitHub mutations from poller, local receipts, Codex calls, background service, Task Scheduler, or automatic delivery
- **Operator report:** https://github.com/zyyu1/personal-workspace/issues/4#issuecomment-7063375466
- **Design Window final approval:** https://github.com/zyyu1/personal-workspace/issues/4#issuecomment-7063391810
- **Scope:** Acceptance of the operator-invoked **B1 read-only classifier only**. Continuous watching, approved live task ingestion, automated Codex delivery, acknowledgement/retry and B2/B3 remain unimplemented and unauthorized.

## Forward Phase Note — B2 Design Approved (2026-11-21)

B1 operational PASS remains unchanged. The user subsequently approved B2 notification-only design V1.0. The formal frozen design is `docs/dispatch/B2_DESIGN_APPROVED.md`; development **only** of disabled-by-default supervised B2A code is now authorized on a separate branch, pending independent QA. This note does not authorize a live queue message or unattended listener. See `docs/dispatch/B2_STATUS.md` and GitHub Issue #8.
