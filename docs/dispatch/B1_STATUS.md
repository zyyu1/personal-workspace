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
- **B2:** BLOCKED — requires Revision 02 independent QA ACCEPTED, a separately authorized successful real Windows B1 smoke, separate design authorization and safeguards/QA.
- **B3:** BLOCKED — requires additional authorization and actual authenticated delivery/ACK controls
- **Module 007:** Existing independent implementation QA acceptance not recorded by this B1 activity; no Module 007 code work authorized by B1
- **Module 008:** NOT STARTED / BLOCKED BY MODULE 007 independently QA-accepted implementation
- **Revision 02:** **REMEDIATION AUTHORIZED** — `docs/dispatch/B1_REMEDIATION_REV02.md`; only Windows explicit UTF-8 GitHub adapter decoding/exception handling and tests. New scoped development PR + independent QA mandatory. **Do not rerun real Windows host smoke until QA ACCEPTED and new Design Window authorization**.
- **Next Action:** Development Window reads Revision 02, implements minimal repair on a fresh branch from main, submits independent QA and new PR, and stops. Original `gh` installation/auth PASS stands; no reinstall or permission changes allowed.

**Security boundary:** Accepting and merging B1 code does **not** authorize executing remote instructions, sending `codex queue`, starting background services/Task Scheduler, writing to GitHub from the poller, merging future modules, or activating B2/B3. The initial B0 probe verified targeted delivery, not unattended dispatch.
