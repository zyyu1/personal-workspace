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
- **Windows Host Verification:** **FAIL (2026-11-21)** — Windows 10 Pro, Python 3.13.2, preferred encoding `cp936`; official GitHub CLI `2.105.0` installed and authenticated, private repo GET PASS. One real `--once --dry-run --no-receipts` poll exited **1** without classification due to locale-dependent `subprocess.run(text=True)` UTF-8 decoding failure and subsequent `stdout=None` AttributeError. Evidence: https://github.com/zyyu1/personal-workspace/issues/4#issuecomment-7062988330.
- **B1 Automatic Operation:** NOT ENABLED — code merger does not install, schedule or run a listener on Windows
- **B2:** BLOCKED — requires successful real authenticated B1 Windows smoke, design decision, security/retry/ACK model and separate approval/independent QA.
- **B3:** BLOCKED — requires additional authorization and actual authenticated delivery/ACK controls
- **Module 007:** Existing independent implementation QA acceptance not recorded by this B1 activity; no Module 007 code work authorized by B1
- **Module 008:** NOT STARTED / BLOCKED BY MODULE 007 independently QA-accepted implementation
- **Revision 02:** **CODE QA ACCEPTED / MERGED** — PR #6 candidate `4926d31befd814be6392498c167529d2a6b2241a`, merge `fad4bfb94d685111694c341fc4be10556de339f4`; independent QA 12/12 PASS, B1 Python tests 47/47 PASS, workspace tests 104/104 PASS. Windows real retest NOT YET RUN.
- **Next Action:** The Windows execution operator reads `docs/dispatch/B1_WINDOWS_HOST_SMOKE_REV02.md`, runs only the separately authorized one-time authenticated `--once --dry-run --no-receipts` real host poll on updated main, posts sanitized evidence to Issue #4 and stops. No B2/B3 activation.

**Security boundary:** Accepting and merging B1 code does **not** authorize executing remote instructions, sending `codex queue`, starting background services/Task Scheduler, writing to GitHub from the poller, merging future modules, or activating B2/B3. The initial B0 probe verified targeted delivery, not unattended dispatch.

## Revision 02 merge and host retest authorization (2026-11-21)

- **Revision 02 PR / QA:** https://github.com/zyyu1/personal-workspace/pull/6 and https://github.com/zyyu1/personal-workspace/pull/6#issuecomment-7063189705
- **Design Window Acceptance:** https://github.com/zyyu1/personal-workspace/pull/6#issuecomment-7063318650
- **Merge commit:** `fad4bfb94d685111694c341fc4be10556de339f4`
- **Host Retry Instruction:** `docs/dispatch/B1_WINDOWS_HOST_SMOKE_REV02.md`
- **Operational Result:** PENDING / PRIOR FAIL still stands until the new Windows real host smoke is independently verified.
- **B2/B3:** NOT AUTHORIZED.
