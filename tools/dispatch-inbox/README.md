# Personal Workspace Dispatch Inbox — B1 and B2A

This directory contains the approved B1 read-only GitHub Issues inbox classifier. It is an operator-invoked diagnostic tool, not a dispatcher. It never calls Codex, never writes to GitHub, and never starts Module 007 or 008.

## Windows prerequisites

- Python 3.11 or newer.
- The official GitHub CLI (`gh`) already installed and authenticated for `github.com` with read access to the private `zyyu1/personal-workspace` repository.
- No token, session UUID, repository selector, or arbitrary owner is accepted on the command line.

The tool does not install dependencies. When `gh` is missing or authentication is unavailable it fails closed with an `UNAVAILABLE` classification and a sanitized reason code.

## Usage

From the repository root:

```powershell
py -3.13 tools/dispatch-inbox/dispatch_inbox.py --once --dry-run
```

Exactly one bounded poll is performed. Both flags are mandatory. The GitHub adapter uses only `gh api --method GET`, a 15-second subprocess timeout, at most three pages and at most 30 records per page. It never uses Issue text in a shell command.

The adapter captures `gh` stdout/stderr as bytes rather than using the Windows locale. Successful API JSON is size-bounded and decoded strictly as UTF-8, so a `cp936` system locale cannot corrupt Chinese or accented content. Missing, empty, invalid UTF-8 or malformed JSON stdout fails closed as `GH_MALFORMED_RESPONSE`. Failed-command stderr is bounded and decoded only for sanitized error classification; raw output is never printed or trusted.

Local deterministic fixtures:

```powershell
py -3.13 tools/dispatch-inbox/dispatch_inbox.py --once --dry-run --fixture tools/dispatch-inbox/fixtures/eligible.json --no-receipts
py -3.13 tools/dispatch-inbox/dispatch_inbox.py --once --dry-run --fixture tools/dispatch-inbox/fixtures/blocked-008.json --no-receipts
```

The four classifications are:

- `ELIGIBLE_DRY_RUN`: validation passed, but B1 does not deliver anything.
- `BLOCKED_GATE`: the signed authorization or module dependency gate is not ready.
- `REJECTED_UNTRUSTED`: identity, schema, path, SHA, expiry, label, or trust validation failed.
- `UNAVAILABLE`: the dependency, authentication, network, rate-limit, response, or configuration was unavailable.

Output is restricted to Issue number, dispatch ID, classification, reason code, fixed repository, verified blob SHA and duplicate marker. It does not print prompts, credentials, session identifiers, authentication output, or personal filesystem paths.

## Strict envelope

An Issue must contain exactly one fenced `dispatch` JSON object with exactly these fields:

`schema_version`, `dispatch_id`, `mode`, `module`, `repo`, `handoff_path`, `handoff_blob_sha`, `created_by`, `expires_at`, `requires_human_approval`, `gate_status`.

Only the fixed private repository and trusted account are accepted. Handoffs must be Markdown below `docs/handoffs/` or `docs/dispatch/`. The tool reads the file from `main`, verifies its Git blob SHA and parses anchored canonical fields. Incidental prose and substring matches never authorize implementation.

The current B1 instruction is authorized only when all of these exact fields are present once:

```text
Status: IMPLEMENTATION APPROVED FOR B1 ONLY
Owner: Windows Codex Development Window
Repository: zyyu1/personal-workspace
```

The status may include the canonical ` — YYYY-MM-DD` suffix and fields may use the documented `**Field:** value` Markdown form. Duplicate, contradictory, differently cased, ambiguous, `DRAFT`, `UNAUTHORIZED`, `NOT AUTHORIZED`, `APPROVED?`, or conditional values fail closed.

Module 008 implementation remains `BLOCKED_GATE` unless future authoritative files provide the following minimum machine-readable evidence. B1 does not create or alter these records:

```text
# docs/handoffs/007/STATUS.md
Module: 007
Independent QA: ACCEPTED
Implementation Acceptance: ACCEPTED
Accepted Implementation SHA: <40-hex Module 007 implementation commit>
Independent QA Report: docs/handoffs/007/<qa-report>.md

# referenced QA report
Module: 007
QA Decision: ACCEPTED
Accepted Implementation SHA: <the same 40-hex commit>

# docs/handoffs/008/STATUS.md
Module: 008
Implementation: AUTHORIZED
Implementation Authorization: ACTIVE
```

The SHA must not be the A01 shared-platform baseline, must match the independent QA report, and must resolve as a commit in this repository through a bounded read-only GET request. The current 007/008 statuses do not satisfy this contract, so real Module 008 intent remains blocked.

GitHub authorship and `dispatch:approved` are necessary but not sufficient authorization. B1 only classifies; it cannot execute an eligible request.

## Dedupe receipts

By default, a bounded receipt file is atomically replaced under the current user's local application-data directory. The key is GitHub Issue number plus stable dispatch ID. A repeat observation is marked `duplicate=true`; it is never described as delivered or acknowledged. At most 500 entries are retained.

Use `--no-receipts` to opt out. Receipt corruption fails closed to a new local receipt set but never changes GitHub or business data. The current receipt store is local to one Windows user/device; it is not cloud synchronization or a cross-process transaction database.

## Security and threat model

Threats include forged authors/labels, malicious JSON, shell metacharacters, traversal or external URLs, stale/mismatched blobs, expired dispatches, false gate claims, oversized responses, partial pagination, auth/rate-limit failures, replay and secret leakage.

Controls include exact field allowlisting, fixed repo/author/ref, URL/path rejection, SHA pinning, timezone-aware expiry, explicit human-approval flag for implementation mode, canonical authorization/status fields, cross-file QA/SHA consistency, bounded API work, subprocess argument arrays with `shell=False`, local atomic bounded receipts and sanitized outputs. GitHub Contents data requires `encoding=base64`, exact path/type, a matching Git blob SHA and UTF-8 text. Only ASCII CR/LF/space/tab wrapping is removed before strict Base64 validation. The B1 classifier contains no `codex` invocation and no GitHub write method.

No global code-page, `PYTHONUTF8`, `PYTHONIOENCODING` or console mutation is required. Revision 02 development and unit tests do not authorize a real authenticated host poll; that smoke remains separately gated by independent QA and a later Design Window instruction.

The listener requires only outgoing HTTPS performed by `gh`; it opens no network port and requests no filesystem/network-listening privilege. It does not add a service, startup item, scheduled task, daemon, watcher or background process.

## Troubleshooting

- `GH_NOT_INSTALLED`: install/authenticate `gh` manually only after separate operator approval. B1 never installs it.
- `GH_AUTH_UNAVAILABLE`: run `gh auth status -h github.com` yourself and correct the account/scopes without pasting tokens into logs.
- `GH_TIMEOUT`, `GH_OFFLINE`, `GH_RATE_LIMITED`, `GH_FORBIDDEN`, `GH_NOT_FOUND`, `GH_REQUEST_FAILED`, `GH_MALFORMED_RESPONSE`, `GH_RESPONSE_TOO_LARGE`, `GH_PAGE_LIMIT_REACHED`: correct connectivity, access, or the bounded polling configuration, then rerun manually. The tool never prints the raw authentication response.
- On non-UTF-8 Windows locales, do not work around adapter failures with `chcp`, `PYTHONUTF8` or `PYTHONIOENCODING`. Record the sanitized code and follow the current approved remediation/smoke gate.
- `NO_ELIGIBLE_TASKS`: no bounded open Issue set was returned. This is not execution authorization.

## Disable and uninstall

There is no installed service to disable. Stop by not invoking the command. To remove B1, delete `tools/dispatch-inbox/` from a reviewed branch. Optional local receipts may be removed manually from the current user's local application-data `PersonalWorkspace/dispatch-inbox` directory. No project, GitHub, Codex, service or scheduler state needs cleanup.

## Future gates

B2 notification delivery and B3 implementation routing are separate, blocked phases requiring new Design Window approval and independent QA. B1 intentionally has no `codex queue`, no automatic delivery, no Issue mutation and no implementation routing.

## B2A supervised notification sender

`b2_notify.py` is an isolated, notification-only B2A layer. It does not change the B1 command above. It is disabled unless all of the following are true:

1. The operator explicitly supplies both `--notify-once` and `--enable-notifications`.
2. A strict user-local configuration exists at `%LOCALAPPDATA%\PersonalWorkspace\dispatch-inbox\b2-notify-config.json` and contains `dispatch_enabled: true` plus `notification_only: true`.
3. The current Windows user, fixed private repository, expected author, exact canonical UUID and pinned absolute `codex.exe` path match that local configuration.
4. Exactly one open Issue passes the strict v2 Issue, main-branch notification-authorization record, handoff SHA, expiry and identity checks.
5. The durable local outbox and one-instance lock can be written before the queue process starts.

Revision 01 enforces exact JSON scalar types before any authorization comparison: integer fields must be actual JSON integers (never booleans or integral floats), authorization must be the actual JSON boolean `true`, the local approval flag must be the actual boolean `false`, and identity/path/SHA fields must be actual strings. Values such as `2.0`, `1`, `"true"` or `null` are never coerced and fail closed before PREPARED state or sender access.

No local configuration is committed. A future operator configuration has exactly these keys; keep `dispatch_enabled` false until independent QA and a separate Design Window live-probe authorization:

```json
{
  "version": 1,
  "dispatch_enabled": false,
  "notification_only": true,
  "repository": "zyyu1/personal-workspace",
  "expected_author": "zyyu1",
  "expected_user": "<CURRENT_WINDOWS_USER>",
  "thread_uuid": "<EXACT_EXISTING_THREAD_UUID>",
  "codex_executable": "<ABSOLUTE_PINNED_CODEX.EXE_PATH>"
}
```

The real sender command is a fixed argument array: `codex queue --thread <LOCAL_UUID> --message <FIXED_TEMPLATE>`, with `shell=False`, no `--resume`, no `--last` and no arbitrary Issue text. The target UUID is never printed, written to GitHub or stored in the outbox. Queue exit zero records `QUEUE_SUBMITTED`; it never records delivery or `ACK_VERIFIED`.

The local write-ahead outbox records `PREPARED` before invoking Codex. `PREPARED`, `QUEUE_SUBMITTED`, `UNKNOWN_DELIVERY`, `ACK_REPORTED`, `ACK_VERIFIED` and `COMPLETE` suppress automatic resubmission. A recovered `PREPARED` becomes `UNKNOWN_DELIVERY`. Corrupt/unwritable state, a lock conflict, disabled config, cancelled/expired authorization or an uncertain queue result fails closed. There is no retry loop.

Cancellation before `PREPARED` blocks submission. Cancellation after a queue item was submitted is best effort only and cannot be presented as revoking an already queued message.

The checked-in `fixtures/b2a-policy-cases.json` is synthetic test data only. It is not a live authorization record and cannot enable delivery. All B2A development and QA tests inject fake queue runners. **LIVE QUEUE NOT RUN / B2B NOT ENABLED / B3 NOT AUTHORIZED / MODULE 008 BLOCKED.**

### B2A disable and removal

- Immediate stop: leave `dispatch_enabled` false or do not invoke the command.
- Remove local capability: delete the user-local configuration after verifying the exact path.
- Preserve an outbox containing `PREPARED`, `QUEUE_SUBMITTED` or `UNKNOWN_DELIVERY` until an operator has reconciled the original thread; deleting it can defeat deduplication.
- A stale lock must be inspected and removed manually only after confirming no process is active. The code never auto-breaks a lock.
- No service, scheduled task, daemon, watcher, startup entry, port or GitHub write permission is installed, so there is no background component to uninstall.

The following command shape is documented for a separately authorized future one-time host probe. It must not be used during B2A development or code QA:

```powershell
py -3.13 tools/dispatch-inbox/b2_notify.py --notify-once --enable-notifications
```

See `B2A_OSS_REUSE_REVIEW.md` for the verified reuse decision and `docs/dispatch/B2_DESIGN_APPROVED.md` for the frozen security model.

## Tests

```powershell
py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v
```

The tests use local data and subprocess spies; they do not contact GitHub or Codex.
