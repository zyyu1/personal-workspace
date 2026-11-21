# Personal Workspace Dispatch Inbox — B1

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

Only the fixed private repository and trusted account are accepted. Handoffs must be Markdown below `docs/handoffs/` or `docs/dispatch/`. The tool reads the file from `main`, verifies its Git blob SHA and checks for an explicit approved/authorized record. Module 008 implementation remains `BLOCKED_GATE` until the authoritative Module 007 status records independent QA acceptance.

GitHub authorship and `dispatch:approved` are necessary but not sufficient authorization. B1 only classifies; it cannot execute an eligible request.

## Dedupe receipts

By default, a bounded receipt file is atomically replaced under the current user's local application-data directory. The key is GitHub Issue number plus stable dispatch ID. A repeat observation is marked `duplicate=true`; it is never described as delivered or acknowledged. At most 500 entries are retained.

Use `--no-receipts` to opt out. Receipt corruption fails closed to a new local receipt set but never changes GitHub or business data. The current receipt store is local to one Windows user/device; it is not cloud synchronization or a cross-process transaction database.

## Security and threat model

Threats include forged authors/labels, malicious JSON, shell metacharacters, traversal or external URLs, stale/mismatched blobs, expired dispatches, false gate claims, oversized responses, partial pagination, auth/rate-limit failures, replay and secret leakage.

Controls include exact field allowlisting, fixed repo/author/ref, URL/path rejection, SHA pinning, timezone-aware expiry, explicit human-approval flag for implementation mode, authoritative gate reads, bounded API work, subprocess argument arrays with `shell=False`, local atomic bounded receipts and sanitized outputs. The code contains no `codex` invocation and no GitHub write method.

The listener requires only outgoing HTTPS performed by `gh`; it opens no network port and requests no filesystem/network-listening privilege. It does not add a service, startup item, scheduled task, daemon, watcher or background process.

## Troubleshooting

- `GH_NOT_INSTALLED`: install/authenticate `gh` manually only after separate operator approval. B1 never installs it.
- `GH_AUTH_UNAVAILABLE`: run `gh auth status -h github.com` yourself and correct the account/scopes without pasting tokens into logs.
- `GH_TIMEOUT`, `GH_OFFLINE`, `GH_RATE_LIMITED`, `GH_FORBIDDEN`, `GH_NOT_FOUND`, `GH_REQUEST_FAILED`, `GH_MALFORMED_RESPONSE`, `GH_RESPONSE_TOO_LARGE`, `GH_PAGE_LIMIT_REACHED`: correct connectivity, access, or the bounded polling configuration, then rerun manually. The tool never prints the raw authentication response.
- `NO_ELIGIBLE_TASKS`: no bounded open Issue set was returned. This is not execution authorization.

## Disable and uninstall

There is no installed service to disable. Stop by not invoking the command. To remove B1, delete `tools/dispatch-inbox/` from a reviewed branch. Optional local receipts may be removed manually from the current user's local application-data `PersonalWorkspace/dispatch-inbox` directory. No project, GitHub, Codex, service or scheduler state needs cleanup.

## Future gates

B2 notification delivery and B3 implementation routing are separate, blocked phases requiring new Design Window approval and independent QA. B1 intentionally has no `codex queue`, no automatic delivery, no Issue mutation and no implementation routing.

## Tests

```powershell
py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v
```

The tests use local data and subprocess spies; they do not contact GitHub or Codex.
