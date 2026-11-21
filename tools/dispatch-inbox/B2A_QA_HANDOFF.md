# B2A Independent QA Handoff

## Candidate

- Repository: `zyyu1/personal-workspace`
- Work order: [Issue #8](https://github.com/zyyu1/personal-workspace/issues/8)
- Authority: `docs/dispatch/B2A_EXECUTION_INSTRUCTION.md`
- Revision authority: `docs/dispatch/B2A_REMEDIATION_REV01.md` on `main`
- Frozen design: `docs/dispatch/B2_DESIGN_APPROVED.md`
- Branch: `codex/dispatch-b2a`
- Accepted base: `6bd25582484f4d751c471328beac276f05e9bdc6`
- Implementation commit: `ed3a588a4a84c6ea569d51afb206c70894c96e09`
- Rejected candidate: `0d37e2ff038b23ce390f4bcff8ee3e3182076ce4`
- Original independent QA: **REJECTED**, [B2A-QA-001 evidence](https://github.com/zyyu1/personal-workspace/pull/9#issuecomment-7063918022)
- Revision 01 remediation commit: `7ed48ce7cb33608c8f57cbbb0f73ed01cf0983a2`
- Review mode: independent QA, review only; do not modify the candidate

The final Revision 01 candidate HEAD is the branch tip containing this updated handoff and is recorded in the PR. The original implementation and rejected QA history remain unchanged; the remediation commit contains only the authorized strict-type fix, adversarial tests and B2A runbook clarification.

## Revision 01 finding and fix

Original QA reproduced a High fail-open caused by Python numeric equality: `True == 1`, `2.0 == 2` and `8001.0 == 8001`. The rejected candidate incorrectly authorized Issue/Record values `schema_version: 2.0`, `notification_authorized: 1`, `notification_template_version: true` and `issue_number: 8001.0`.

Revision 01 adds explicit, audit-friendly field type maps at `b2_notify.py:86-116`, validates outer Issue identity at `342-376`, applies Issue types before any envelope comparison at `385`, applies Record types before any record comparison at `430`, and requires `record["notification_authorized"] is True` at `431`. Local config version and all config scalar fields now use exact types at `204-235`. No value is coerced with `int()`, `str()` or `bool()`.

| Input | Exact type contract before value checks |
| --- | --- |
| Issue envelope integers | `schema_version`: `type(value) is int` |
| Issue envelope strings | dispatch ID, mode, module, repo, both paths, both SHAs, creator and expiry: `type(value) is str` |
| Issue envelope approval | `requires_human_approval`: `type(value) is bool` and `is False` |
| Outer Issue identity | positive `number`: exact `int`; repository/state/login: exact `str`; labels reject non-string names |
| Record integers | schema version, Issue number and template version: exact `int` |
| Record authorization | exact `bool` and `is True` |
| Record strings | dispatch ID, mode, module, repo, scope, handoff path/SHA, expiry, nonce and creator: exact `str` |
| Local config | version exact integer `1`; flags exact `bool`; identity/UUID/executable exact `str` |

The five original attacks and adjacent bool/int/float/string/null substitutions are SHA-consistent test inputs. Every rejected input asserts: no `AuthorizedNotification`, zero fake sender calls and no PREPARED/outbox file. Canonical values still produce `AUTHORIZED_NOTIFICATION`; `mode=implement` remains forbidden.

## Scope and changed files

- `tools/dispatch-inbox/b2_notify.py` — isolated B2A policy, local config, durable outbox, lock and injectable queue sender.
- `tools/dispatch-inbox/tests/test_b2_notify.py` — simulated/adversarial tests; no real queue runner.
- `tools/dispatch-inbox/fixtures/b2a-policy-cases.json` — explicitly non-live synthetic policy fixture.
- `tools/dispatch-inbox/README.md` — default-off configuration, operation, disable and removal guidance.
- `tools/dispatch-inbox/B2A_OSS_REUSE_REVIEW.md` — current required three-project reuse review.
- This handoff.

Revision 01 changes only `b2_notify.py`, `test_b2_notify.py`, the B2A section of `README.md`, and this handoff.

There are no changes to `src/`, B1 executable semantics, frozen designs, Module 007/008 handoffs or status files, services, schedulers, startup configuration, repository labels or GitHub authorization records.

## Architecture and safety behavior

1. The existing B1 `dispatch_inbox.py --once --dry-run` remains separate and unchanged.
2. B2A requires both `--notify-once` and `--enable-notifications`, plus a strict user-local config with `dispatch_enabled=true`. Missing/false config blocks before GitHub or Codex.
3. A v2 Issue is only a pointer. It must match the fixed private repo, author, open state, exact approval label, allowlisted notification/probe mode, module, safe paths, expiry and strict field set.
4. A separate main-branch notification authorization record must be blob-pinned, explicitly `NOTIFICATION_ONLY`, bind the exact Issue/dispatch/module/handoff/template/expiry/nonce, and match a second pinned handoff blob.
5. Duplicate JSON keys, unknown fields, hostile prose, unsafe paths, stale/changed blobs, cancellation, expiry and `mode=implement` fail closed.
6. The message is a fixed template composed only from validated identifiers, safe path and SHAs. It explicitly prohibits edits, Git writes and Module 007/008 work.
7. The exact thread UUID, expected Windows user and absolute `codex` executable path exist only in local config. UUID is not emitted or stored in the outbox.
8. The sender uses one fixed argument array with `shell=False`, bytes capture, bounded output, no `--resume`, `--last`, remote endpoint or arbitrary flags.
9. The outbox atomically persists and fsyncs `PREPARED` before queue invocation. A lock prevents concurrent senders. Existing or recovered uncertain states suppress resubmission.
10. Queue exit zero becomes `QUEUE_SUBMITTED`, never delivered or ACK verified. Exact nonce text may become only `ACK_REPORTED`; B2A has no transition source to `ACK_VERIFIED`.

## Developer test evidence

| Command/check | Result |
| --- | --- |
| `py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v` | PASS — 85/85; includes all prior 47 B1 tests and 38 B2A tests |
| `py -3.13 -m py_compile tools/dispatch-inbox/dispatch_inbox.py tools/dispatch-inbox/b2_notify.py tools/dispatch-inbox/tests/test_dispatch_inbox.py tools/dispatch-inbox/tests/test_b2_notify.py` | PASS, exit 0 |
| Default `py -3.13 tools/dispatch-inbox/b2_notify.py` | PASS — blocked before config/queue with `EXPLICIT_NOTIFY_OPT_IN_REQUIRED`, exit 64 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0; 0 errors and 12 pre-existing warnings outside B2A |
| `npm run test` | PASS — 9/9 files, 104/104 tests |
| `npm run build` | PASS, exit 0 |
| `git diff --check` | PASS, exit 0 |
| Real `codex queue` | **NOT RUN — PROHIBITED** |

All sender tests inject fake runners. The only real Codex command used during preflight was the read-only `codex queue --help`; no message was submitted.

## 24-point developer self-check

| # | Result | Evidence |
| --- | --- | --- |
| 1 | PASS | B1 file unchanged; all 47 B1 tests and fixture dry-run pass. |
| 2 | PASS | `probe`/`notify` allowlist; `implement` unconditionally rejected. |
| 3 | PASS | Repo, author, state and label checked; record authorization is independently required. |
| 4 | PASS | Both record and handoff path/ref/blob SHA are exact and tested. |
| 5 | PASS | Missing, multiple, duplicate, ambiguous, expired and cancelled inputs fail closed; Revision 01 exact scalar types close B2A-QA-001. |
| 6 | PASS | Module allowlist, module/path binding and changed SHA rejection tested. |
| 7 | PASS | 008 notification is allowed only as notification; fixed message says implementation remains blocked. |
| 8 | PASS | Hostile Issue prose, URLs and shell text never enter the fixed message. |
| 9 | PASS | UUID stays in strict local config and is absent from public result/outbox. |
| 10 | PASS | Invalid UUID and simulated unavailable session block safely; no `--last`, new session or forced resume. |
| 11 | PASS | Exact executable/argument array, bytes, bounded timeout and `shell=False` verified by spy. |
| 12 | PASS | Exit zero records `QUEUE_SUBMITTED / QUEUE_EXIT_ZERO_NOT_ACK`. |
| 13 | PASS | Only exact ACK text can become `ACK_REPORTED`; `ACK_VERIFIED` transition is unavailable. |
| 14 | PASS | A repeated attempt is suppressed and runner count remains one. |
| 15 | PASS | Simulated crash after PREPARED recovers as UNKNOWN with no second runner call. |
| 16 | PASS | Exclusive lock blocks a second process/instance. |
| 17 | PASS | Timeout, unavailable session and non-UTF8/GBK-like bytes are bounded/sanitized; no locale workaround. |
| 18 | PASS | Corrupt and injected failed persistence block before the queue runner; PREPARED is durable/atomic. |
| 19 | PASS | Disabled config, cancellation and expiry block before send; post-submit cancellation caveat documented. |
| 20 | PASS | Reuses GET-only B1 client; B2A contains no GitHub write or Git operation. |
| 21 | PASS | No service, scheduler, daemon, watcher, autostart or B2B setup. |
| 22 | PASS | No app/module source change; message explicitly prohibits Module 007/008 work. |
| 23 | PASS | Python, mocked runner, Workspace, typecheck, lint, build and diff checks pass. |
| 24 | **NOT VERIFIED** | Real same-thread delivery/ACK is prohibited until QA acceptance and a separate Design Window one-time probe authorization. |

## Independent QA request

Please inspect the actual PR and reproduce the original five B2A-QA-001 attacks plus adjacent bool/int/float/string/null substitutions. Confirm they block before PREPARED/sender access, then repeat the policy, persistence and queue-spy review. Confirm branch/base/head, exact diff, B1 regression, default-off consent, local UUID privacy, fixed command/message, strict record/handoff identity, no real queue call, no GitHub writes and no background/module changes. Post one PR conversation comment with reviewed SHA, commands/exit codes, the 24-row decision and exactly one result:

- `ACCEPTED`
- `ACCEPTED WITH FIXES`
- `REJECTED`
- `INSUFFICIENT EVIDENCE`

QA must not modify code, create a live authorization Issue, enable local delivery or call real `codex queue`.

## Known limitations and stage gates

- The GitHub authorization record is not a cryptographic signature. Without enforced branch protection/review, the same-account approval risk remains.
- Local outbox protection relies on the current Windows user's directory ACL and successful local persistence; there is no server backup or cross-device state.
- At-most-one automatic submission is implemented; end-to-end exactly-once delivery is not claimed.
- Queue success is not visibility or ACK. Same-thread ACK remains NOT VERIFIED.
- Stale locks and UNKNOWN delivery require manual reconciliation; the code never silently retries.
- **LIVE QUEUE NOT RUN / B2B NOT ENABLED / B3 NOT AUTHORIZED / MODULE 007 NOT STARTED / MODULE 008 BLOCKED.**
