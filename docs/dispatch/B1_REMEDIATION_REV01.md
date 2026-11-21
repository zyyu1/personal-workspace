# Personal Workspace — B1 Read-Only Dispatch Inbox Remediation Revision 01

**Design Window Decision:** REMEDIATION REQUIRED — independently QA REJECTED candidate; do not merge.  
**Authorized scope:** Fix **only B1** blocking findings and cover the Windows smoke gap. No B2/B3 delivery, no Module 007/008 implementation.  
**Date:** 2026-11-21  
**Development PR:** [#5](https://github.com/zyyu1/personal-workspace/pull/5), branch `codex/dispatch-b1`  
**Rejected candidate HEAD:** `95ad61fa9fab308cb7a87c7d30929f448779874d`  
**Earlier implementation commit:** `dd39a2f74319ee1c49785b6a68d8860204562f55`  
**Independent QA evidence:** [PR #5 QA REJECTED comment](https://github.com/zyyu1/personal-workspace/pull/5#issuecomment-7062203140) — 17 PASS / 2 FAIL / 1 PARTIAL, three High blocking defects.  
**Original B1 execution authority:** [B1_EXECUTION_INSTRUCTION.md](./B1_EXECUTION_INSTRUCTION.md); this Revision 01 narrows and clarifies the remediation scope.  
**Safety:** Poller remains read-only and operator-invoked. No `codex queue`, no `codex exec`, no GitHub write API from poller, no auto-start/service/scheduler, no code changes in `src/`. Module 008 stays blocked by independently accepted Module 007 implementation.

## 1. Required repairs

### R01 — B1-QA-001 / HIGH: authorization parser can fail open

**Observed implementation:** `tools/dispatch-inbox/dispatch_inbox.py:161–165`; `_has_signed_authorization` uses `"AUTHORIZED" in upper` and generic `"APPROVED" in upper`, allowing `UNAUTHORIZED` and prose/ambiguous approval-like strings.

**Required behavior:**
- Replace substring matching with a strict, anchored parse of canonical **authoritative main-branch approval fields**. Markdown formatting may be supported only as an explicit field grammar; e.g. `**Status:** IMPLEMENTATION APPROVED FOR B1 ONLY` and `**Design Window Authorization:** APPROVED` for the existing B1 instruction/status. Validate the correct module and exact allowed approval state, not generic words anywhere in a document.
- Treat missing, duplicate, contradictory, malformed, withdrawn, `DRAFT`, `PENDING`, `NOT AUTHORIZED`, `UNAUTHORIZED`, `NOT STARTED`, `APPROVED?`, `PREPARED / BLOCKED`, historical quotation and incidental `APPROVED` in explanatory prose as **not authorizing implementation**. Any ambiguity must fail closed as `BLOCKED_GATE` or `REJECTED_UNTRUSTED`, with a stable reason code.
- Distinguish **design approval** from **implementation approval**, and **B1-only authorization** from B2/B3. Never infer implementation authorization from a matching Issue label or body.
- Do not change or overwrite frozen 007/008 design files to make the parser pass. If existing authoritative texts need a new machine-readable authorization manifest, propose it to Design Window for a separate explicit decision rather than silently relaxing the parser.
- Preserve existing B1 fixture happy path but make it use an explicitly structured authorized record, not an ad hoc string.

**Must-test negative cases:** exact QA example `Status: DRAFT\nApproval: APPROVED?\nImplementation: UNAUTHORIZED`; `NOT AUTHORIZED`; `UNAUTHORIZED`; `Authorization: NOT AUTHORIZED`; duplicate contradictory fields; `APPROVED` only in prose; `APPROVED WITH CONDITIONS` not explicitly whitelisted; mixed case/whitespace/Markdown variants; unrecognized or wrong-module authorization. Assert none becomes `ELIGIBLE_DRY_RUN`. One exactly valid B1 authorization record must remain positive.

### R02 — B1-QA-002 / HIGH: Module 008 dependency gate lacks accepted implementation SHA

**Observed implementation:** `dispatch_inbox.py:234–241` searches for `QA: ACCEPTED` / `QA:** ACCEPTED` substrings and marks an 008 implementation request eligible even without an accepted Module 007 implementation commit.

**Required behavior:**
- Strictly parse the *current authoritative* `docs/handoffs/007/STATUS.md` from pinned `main`. Require all of: Module ID `007`; exact independent QA verdict `ACCEPTED` (not `ACCEPTED WITH FIXES` unless explicitly allowed by later Design Window decision); a dedicated **Accepted Implementation SHA** field with an exact 40-hex Git commit SHA; an explicit implementation acceptance / accepted baseline record; and consistent evidence from the independent Module 007 QA result tied to that **same SHA**. If the repository lacks the required structured evidence, **BLOCKED_GATE**, not eligible.
- Where supported without new write capability, verify the specified commit belongs to this repository and matches the accepted implementation referenced by the QA report; a syntactically valid SHA alone is not enough. Do not silently treat A01 baseline `dc829a9f69d2a31c1b3b3eb2429fe0124cc9d237` as the Module 007 implementation.
- Require that Module 008 itself is separately marked **implementation authorization active** in the authoritative 008 operational status, not merely `DESIGN APPROVED` and `IMPLEMENTATION AUTHORIZATION: CONDITIONAL, NOT YET ACTIVE`. Independent 007 acceptance is necessary but not by itself sufficient.
- Use an exact machine-checked field/value contract and fail closed on missing, contradictory, duplicated or stale status, mismatched SHA and unavailable QA evidence. If the approved 007 schema does not yet provide these fields, document the minimum proposed future schema for Design Window rather than editing 007 without approval.
- Never modify actual 007/008 status to `ACCEPTED` as a test workaround; test positive scenarios **only in fixtures** until 007 is truly accepted.

**Must-test gate cases:** only `QA: ACCEPTED` with SHA absent; malformed SHA; fake 40-hex SHA not cited by QA; conflicting QA/status SHAs; `QA: ACCEPTED WITH FIXES`; `QA: PENDING`; A01 commit substituted for 007; 007 accepted but 008 not explicitly activated; wrong source module/branch; valid fully consistent fixture. **All except the full positive fixture must classify 008 `BLOCKED_GATE`** (or `UNAVAILABLE` where access truly fails).

### R03 — B1-QA-003 / HIGH: GitHub Contents API wrapped Base64 decoding

**Observed implementation:** `dispatch_inbox.py:354–370`; `base64.b64decode(content, validate=True)` rejects valid GitHub Contents responses whose Base64 field includes newline wrapping.

**Required behavior:**
- Confirm GitHub Contents API `encoding` is the supported `base64` and `content`/SHA are present; strip **only** documented ASCII whitespace (CR/LF/space/tab) before strict Base64 decode, retaining strict rejection of malformed non-base64 data. Handle `binascii.Error`, `ValueError`, `UnicodeDecodeError` and unexpected encoding consistently as sanitized `GH_MALFORMED_RESPONSE`; size-bound before/after decode.
- Preserve main-branch ref, normalized safe path and blob SHA validations. Never use `decode(..., errors="ignore")` or broad decode that silently drops arbitrary characters. Reject non-UTF-8 if text handoffs are required.
- Add representative GitHub API fixtures: multiple Base64-wrapped lines, CRLF variant, valid unwrapped, wrong encoding, bad padding, invalid alphabet, empty/truncated payload, invalid UTF-8, oversized payload, mismatched SHA. Verify real authorized instruction can be read while tampered content fails closed.
- Do not remove API request bounds or switch to an untrusted external URL.

Official representation: https://docs.github.com/en/rest/repos/contents#get-repository-content

## 2. B1-QA-019 / PARTIAL — Windows `gh` missing (environmental)

The independent QA Windows smoke returned `UNAVAILABLE / GH_NOT_INSTALLED` (exit 2). This is **not resolved** by fixing code, and not a reason to install or authenticate tooling without explicit user approval.

- Preserve a safe, meaningful `GH_NOT_INSTALLED` failure path and offline/fixture coverage.
- In the remediation PR, state the exact Windows prerequisite and offer documented **user-initiated** installation of official GitHub CLI, then `gh auth status -h github.com`, then `--once --dry-run` private-repository test. Do not print tokens or prompt to share them with ChatGPT/GitHub Issues.
- If the user does not separately approve a local `gh` installation, do not install it. QA #19 must remain **PARTIAL / NOT VERIFIED** rather than being misrepresented as a PASS. The Design Window will decide whether B1 can be conditionally accepted as code-only; automatic delivery B2 is NOT allowed without a successful real-host smoke.
- Do not substitute GitHub connector results from ChatGPT for the Windows listener's authenticated read result.

## 3. Implementation scope and PR instructions

1. Keep development on existing `codex/dispatch-b1`, PR #5 **OPEN and UNMERGED**. Inspect latest remote branch/HEAD and any concurrent edits before changing files; preserve original rejected SHA in the record.
2. Change only `tools/dispatch-inbox/dispatch_inbox.py`, `tools/dispatch-inbox/tests/test_dispatch_inbox.py`, required fixture(s), README and QA handoff. Avoid unrelated refactor and any code under `src/`.
3. Add targeted regression tests corresponding to R01–R03; record exact negative/positive outcomes and evidence. Existing passing 24 tests are a baseline, **not proof** the three High defects are fixed.
4. Run `py_compile`, full B1 Python test suite, existing project 104-test regression or truthful current total, `typecheck`, `lint`, `build`, `git diff --check`, and a read-only Windows smoke if prerequisites legitimately available. Document commands, exit codes, warnings, and unavailable checks.
5. Push a **new remediation commit** to the same development branch. Update `B1_QA_HANDOFF.md` with Revision 01, QA-001/002/003 before/after evidence, candidate HEAD, exact changed paths and 20-point matrix. Do not rewrite/remove rejected QA comments.
6. Request the same independent QA Window to review the **new** PR HEAD. QA Review Only; it must rerun all three adversarial reproductions and check no new Code/GitHub write/auto-start behavior. QA returns `ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE`, with #19 honestly described.
7. Design Window reviews the independent QA decision, then decides merge/conditional limitations. **Do not self-merge or start B2/B3.**

## 4. Release gate

- **Now:** B1 status = `QA REJECTED / REMEDIATION AUTHORIZED`; no auto-delivery.
- **Pass prerequisite:** all three High findings closed with tests and independent QA evidence. #19 must be separately classified as Windows environment gap unless real host successfully tested.
- **Not allowed:** a correct `codex queue` B0 ACK to be counted as a B1 inbox success; B0 and B1 prove different transport stages.
- **Modules:** 007/008 remain outside this remediation. Module 008 may not start until 007 is independently QA ACCEPTED with accepted implementation SHA and explicit 008 release authorization.

**The Design Window authorizes B1 Revision 01 remediation only.**
