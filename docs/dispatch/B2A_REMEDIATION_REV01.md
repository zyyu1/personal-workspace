# Personal Workspace — B2A Remediation Revision 01

**Status:** REMEDIATION AUTHORIZED / CODE-ONLY — 2026-11-21  
**Owner:** Existing Windows Codex Development Window  
**Repository:** `zyyu1/personal-workspace` (private)  
**PR:** https://github.com/zyyu1/personal-workspace/pull/9  
**Branch:** `codex/dispatch-b2a` — continue on the SAME branch / PR; preserve rejected history  
**Rejected candidate head:** `0d37e2ff038b23ce390f4bcff8ee3e3182076ce4`  
**Implementation:** `ed3a588a4a84c6ea569d51afb206c70894c96e09`  
**Independent QA:** https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7063918022  
**Design authority:** `docs/dispatch/B2_DESIGN_APPROVED.md`, `docs/dispatch/B2A_EXECUTION_INSTRUCTION.md` on main  
**Decision:** REJECTED candidate; authorize **targeted B2A-QA-001 repair** and independent QA re-review.  
**LIVE QUEUE GATE:** BLOCKED; **NO ACTUAL `codex queue`**; B2B, B3 and Modules 007/008 remain blocked.

## 1. Verified blocking defect — B2A-QA-001 / HIGH

QA reproduced a **JSON type-confusion fail-open** in `tools/dispatch-inbox/b2_notify.py` around Issue `schema_version` validation, GitHub Issue number validation, and authorization-record expected-value checks. Python equality is not a strict JSON type check:
- `True == 1` -> `True`;
- `2.0 == 2` -> `True`;
- `8001.0 == 8001` -> `True`.

On an otherwise valid, SHA-consistent test snapshot, these incorrect types were classified `AUTHORIZED_NOTIFICATION`:
- Issue `schema_version: 2.0`;
- record `schema_version: 2.0`;
- record `notification_authorized: 1`;
- record `notification_template_version: true`;
- record `issue_number: 8001.0`.

This violates the frozen v2 exact-schema/fail-closed rule. B2A QA #5 therefore **FAIL**; full candidate QA: **22 PASS / 1 FAIL / 1 NOT VERIFIED**. Passing 76 Python tests and 104 Workspace tests do not waive this High security defect.

## 2. Authorized scope of code changes

**Allowed:**
1. `tools/dispatch-inbox/b2_notify.py` — strict Issue/Record type validation before any security-critical equality or state preparation.
2. `tools/dispatch-inbox/tests/test_b2_notify.py` — focused adversarial and positive regression tests.
3. If required: `tools/dispatch-inbox/fixtures/b2a-policy-cases.json` for new adversarial fixtures, the B2A portion of `tools/dispatch-inbox/README.md`, and `tools/dispatch-inbox/B2A_QA_HANDOFF.md` for accurate Revision 01 evidence.
4. A minimal local-config `version` exact-type check is within this same type-confusion remediation if current code accepts `true` or `1.0` in place of integer `1`. Preserve all other local config behavior.

**Forbidden:** changing B1 adapter/CLI or its accepted 47 tests, app `src/`, frozen B2 design/handoffs, Modules 007/008, any Codex Desktop/queue/session state, startup/task scheduler/daemon, authentication scopes, GitHub API write paths, branch resets, force pushes or merging. No feature expansion or general authorization redesign.

If a new separate issue is found, document it and return to the Design Window rather than silently expanding scope.

## 3. Exact JSON field-type contract (mandatory)

Apply a strict, explicit field-type schema to each *parsed* untrusted v2 Issue envelope, notification authorization record, and security-sensitive outer Issue identity fields. Run type checks **before** value comparisons, before constructing `AuthorizedNotification`, and before writing any durable `PREPARED` state.

**Issue JSON envelope:**
- `schema_version`: `type(value) is int`, value exactly `2`;
- `dispatch_id`: `type(value) is str`, existing ID regex;
- `mode`: `type(value) is str`, allowed `probe|notify`; `implement` unconditionally blocked;
- `module`: `type(value) is str`, existing allowlist;
- `repo`: `type(value) is str`, fixed `zyyu1/personal-workspace`;
- `notification_record_path`, `handoff_path`: `type(value) is str`, existing path safety and exact path binding;
- `notification_record_sha`, `handoff_blob_sha`: `type(value) is str`, exact 40-char lowercase SHA regex and current main checks;
- `created_by`: `type(value) is str`, fixed approved author;
- `expires_at`: `type(value) is str`, timezone-aware parse and expiry;
- `requires_human_approval`: `type(value) is bool`, value **is False**, as frozen B2A contract.

**GitHub outer Issue identity:**
- `number`: `type(value) is int`, positive, reject `true` and integral floats;
- `repository_full_name` and `state`: exact `str` and existing literal allowlists;
- `user.login`: exact `str` and approved author; reject malformed identity object/values;
- labels: preserve existing strict label matching and cancellation rule; do not mistake booleans/numbers for strings.

**Notification authorization Record JSON:**
- `schema_version`, `issue_number`, `notification_template_version`: **`type(value) is int`**, then require exact expected integer values (`2`, matching GitHub Issue number, `1` respectively);
- `notification_authorized`: **`value is True`** (actual JSON boolean true, never 1, 1.0, "true", false or null);
- `dispatch_id`, `mode`, `module`, `repo`, `authorization_scope`, `handoff_path`, `handoff_blob_sha`, `expires_at`, `nonce`, `created_by`: **`type(value) is str`**, and retain all exact matching, SHA, path, scope, expiry and regex checks.

Continue using **exact expected field sets** and duplicate-key rejection; never coerce with `int()`, `str()`, `bool()`, permissive parsing or numeric conversion. Exact scalar type validation must be independent of Python's numeric equality. A helper such as `validate_json_field_types` is acceptable if it remains small, explicit and audit-friendly.

**Local config (only if needed to close same class of defect):** `version` must be an actual int value `1`; bool flags must remain actual `bool` and identity/UUID/executable fields actual `str`. No new config fields, permissions or storage mechanisms.

## 4. Required adversarial and positive tests

Reproduce the **exact original five QA failures** and demonstrate every one now blocks before PREPARED/sender invocation:
1. Issue `schema_version=2.0`;
2. Record `schema_version=2.0`;
3. Record `notification_authorized=1`;
4. Record `notification_template_version=true`;
5. Record `issue_number=8001.0`.

Also test:
- Both Issue and Record integer fields accept the canonical `int`, reject `True`, `False`, `float` values 1.0/2.0/8001.0, strings "1"/"2"/"8001", `None`, negative/inappropriate integers; no implicit casts.
- `notification_authorized` rejects `0`, `False`, `1.0`, `"true"`, `None`, arrays/objects.
- Outer `issue.number=True` and `issue.number=8001.0` rejected.
- Existing `requires_human_approval=False` positive; non-boolean variants and `True` negative.
- Canonical Issue + Record + existing correct blob SHAs continues to classify `AUTHORIZED_NOTIFICATION`; existing `mode=implement` still cannot notify.
- For every malicious typed candidate, spy/assert: **zero real or mocked queue invocation**, no `PREPARED` entry and no change to durable outbox state; no Codex session access.
- Preserve original negative tests: forged author/label, stale SHA, wrong module, expired/cancelled job, duplicate/restart, PREPARED crash safety, `cp936` handling, safe fixed message and ACK state separation.
- Preserve B1 47 tests and B1 §--once --dry-run§ exact default behavior.

Do not add live approved GitHub dispatch Issues or perform real `codex queue`. Test only local fixtures and mock queue runners.

## 5. Evidence and re-review gate

1. Before editing, check PR #9's actual current head equals the rejected candidate `0d37e2ff038b23ce390f4bcff8ee3e3182076ce4`. If changed, **STOP** and report rather than overwrite a concurrent edit. Preserve all historical QA findings.
2. Continue on **same** `codex/dispatch-b2a` branch and PR #9; do not rebase, reset or force push. Record implementation SHA and new candidate HEAD.
3. Run `py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v`, §py_compile§, existing Workspace regression tests, §npm run typecheck§, §npm run lint§, §npm run build§ and §git diff --check§. Report actual pass/fail/exit codes. Do not claim new tests passed unless executed.
4. Update `B2A_QA_HANDOFF.md` with exact original finding, patch locations, type-contract table, adversarial before/after evidence, changed files, test totals, no real queue, 24-point QA matrix and remaining §#24 NOT VERIFIED§.
5. Open a new independent **Review Only** re-review of PR #9 at its **new** candidate HEAD. QA must reproduce the five original attacks and independently test bool/int/float/string/null confusion, exact authorization and no-sender behavior.
6. Deliver: PR URL, new implementation and candidate HEAD, changed paths, all test outputs, independent QA comment, decision §ACCEPTED / REJECTED / INSUFFICIENT EVIDENCE§. No merge until Design Window accepts.
7. **Real Windows notification smoke remains separately gated.** Even if new QA is ACCEPTED, do not run a queue probe or enable B2B/B3 until explicit new Design Window authorization.

**Expected status after this instruction:** `REMEDIATION IN PROGRESS`; existing PR #9 remains OPEN/UNMERGED, original QA REJECTED retained, no live queue sent, Module 007 NOT STARTED and Module 008 BLOCKED.
