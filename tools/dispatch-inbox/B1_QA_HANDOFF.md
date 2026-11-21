# B1 Independent QA Handoff

## Candidate identity

- Repository: `zyyu1/personal-workspace`
- Branch: `codex/dispatch-b1`
- Base: `origin/main` at `563fd5820c77539bf130379737b38342ba70ac6e`
- Implementation commit: `dd39a2f74319ee1c49785b6a68d8860204562f55`
- QA candidate head: resolve the open PR head independently; this handoff commit only adds this report.
- Authoritative instruction: `docs/dispatch/B1_EXECUTION_INSTRUCTION.md` on `main`, blob `e908765a3d5e1a2ac640386f17af96186398b8f3`

Independent QA is **Review Only**. Do not merge, modify code, enable delivery, invoke `codex queue`, install `gh`, start B2/B3, or start Module 007/008.

## Changed paths

All changes are isolated below `tools/dispatch-inbox/`:

- `.gitignore`
- `dispatch_inbox.py`
- `README.md`
- `OSS_REUSE_REVIEW.md`
- `fixtures/eligible.json`
- `fixtures/blocked-008.json`
- `tests/test_dispatch_inbox.py`
- `B1_QA_HANDOFF.md`

No `src/`, handoff status, module code, scheduler, service, startup, repository setting, or GitHub Issue data was changed by the poller.

## Architecture and security boundary

The tool is a Python 3 standard-library, operator-invoked `--once --dry-run` classifier. Its repository, author and `main` ref are fixed constants. The GitHub adapter uses an argument array with `shell=False` and only these external command forms:

- `gh auth status --hostname github.com`
- `gh api --method GET <bounded fixed-repository endpoint>`

It has no Codex subprocess path and no GitHub write method. It opens no inbound socket and installs no service, task, daemon, watcher or startup entry. Both `--once` and `--dry-run` are mandatory. There is no B2 delivery code.

The strict fenced JSON envelope rejects unknown/missing fields, authors, labels, modes, modules, repositories, creators, approval flags, gate states, expiry values, non-Markdown paths, traversal, external URLs, non-main snapshots and SHA mismatches. The authoritative handoff is fetched from `main`, SHA-pinned and checked for an explicit approved/authorized record. Module 008 implementation intent reads Module 007 status and remains blocked while independent QA is pending.

Outputs omit Issue bodies, prompts, auth output, session IDs, tokens and personal paths. Optional dedupe receipts are bounded to 500 entries, atomically replaced under the current user's local application-data directory and disabled with `--no-receipts`. Receipts never claim delivered or acknowledged.

## Windows observations

- OS context: Windows PowerShell, ordinary user execution.
- Python: default `python` 3.11.3; `py -3.13` resolves Python 3.13.
- GitHub CLI: **not installed** (`Get-Command gh` returned no command).
- No dependency was installed or unlocked.
- Real smoke command:

  `py -3.13 tools/dispatch-inbox/dispatch_inbox.py --once --dry-run --no-receipts`

- Real smoke result: exit `2`, classification `UNAVAILABLE`, reason `GH_NOT_INSTALLED`.
- Therefore authenticated private-repository reading and `gh auth status` are **not verified on this host**. This is an expected fail-closed result, not a passing real API smoke.
- Working Tree after smoke contained only the intended B1 development files before commit.

Fixture smoke:

- Eligible fixture: exit `0`, `ELIGIBLE_DRY_RUN / VALIDATED_DRY_RUN_ONLY`.
- Module 008 fixture: exit `0`, `BLOCKED_GATE / MODULE_008_BLOCKED_BY_007_QA`.
- Neither fixture contacts GitHub or Codex.

## Commands and results

| Command | Exit | Result |
| --- | ---: | --- |
| `py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v` | 0 | 24/24 passed |
| `py -3.13 -m py_compile tools/dispatch-inbox/dispatch_inbox.py tools/dispatch-inbox/tests/test_dispatch_inbox.py` | 0 | Passed |
| `npm run typecheck` | 0 | Passed |
| `npm run lint` | 0 | 0 errors; 12 pre-existing warnings in `src/` |
| `npm run test` | 0 | 104/104 passed, 9/9 files |
| `npm run build` | 0 | Production build passed |
| `git diff --check` | 0 | Passed |
| Real `--once --dry-run --no-receipts` | 2 | Expected `UNAVAILABLE / GH_NOT_INSTALLED` |

## Acceptance matrix

| # | Status | Evidence |
| ---: | --- | --- |
| 1 | PARTIAL | Adapter is fixed to the private repo and uses GET only; mocked paging tests pass. Real authenticated read is not verified because `gh` is absent. |
| 2 | PASS | `test_wrong_account_rejected`. |
| 3 | PASS | `test_missing_label_rejected`. |
| 4 | PASS | Unknown mode and extra-field tests; exact field set and schema version enforced. |
| 5 | PASS | Traversal and external-URL tests; POSIX allowlisted Markdown path validation. |
| 6 | PASS | Blob mismatch and non-main snapshot tests. |
| 7 | PASS | Timezone-aware expired-request test. |
| 8 | PASS | 008 implementation fixture/test returns `BLOCKED_GATE` while 007 QA is pending. |
| 9 | PASS | Eligible fixture/test returns `ELIGIBLE_DRY_RUN`; code has no delivery path. |
| 10 | PASS | Composite Issue ID + dispatch ID receipt test marks the second observation duplicate and retains one bounded receipt. |
| 11 | PASS | Missing CLI, timeout and rate-limit tests return bounded sanitized `UNAVAILABLE` codes; README documents auth/offline/403/404/malformed/oversize cases. |
| 12 | PASS | Max 3 pages/30 items by default, hard max 5/50, 15-second timeout, two retries, finite backoff; full final page fails closed with `GH_PAGE_LIMIT_REACHED`. |
| 13 | PASS | Code review: only local fixture/receipt files and outgoing `gh` reads; no listening socket or privilege request. |
| 14 | PASS | Subprocess spy verifies every external executable is `gh`, never Codex. |
| 15 | PASS | Adapter tests require GET and reject POST/PATCH/DELETE; no GitHub write function exists. The development PR is outside poller behavior. |
| 16 | PASS | Repository scan and README confirm no Task Scheduler, service, startup, watcher or installation code. |
| 17 | PASS | Diff is confined to `tools/dispatch-inbox/`; no `src/` or Module 007/008 implementation/status changes. |
| 18 | PASS | 24 Python tests, py_compile, TypeScript, build, 104 existing tests and diff check pass; lint has 0 errors/12 historical warnings. |
| 19 | PARTIAL | Windows smoke truthfully fails closed as `GH_NOT_INSTALLED`; private repo readability and `gh auth status` cannot be verified without separately installing/authenticating `gh`. |
| 20 | PASS | README covers prerequisites, usage, fixtures, security, troubleshooting, disable/uninstall and independent B2/B3 approvals. |

Summary: **18 PASS / 2 PARTIAL / 0 FAIL / 0 NOT VERIFIED**.

## Threat model findings

- Issue text is untrusted and never interpolated into a shell.
- Author and label are insufficient alone; main-branch blob and signed authorization are checked.
- Replay is locally deduplicated but only per Windows user/device; this is not distributed coordination.
- Raw `gh` error/auth output is not printed. Error categories are derived internally and emitted as fixed codes.
- A bounded-page truncation is reported unavailable instead of silently treating a partial inbox as complete.
- Local receipts do not provide cross-process transactional locking or multi-device synchronization. B1 has no background/watch mode, so concurrent scheduled polling is not supported or advertised.
- The host cannot perform the required real GitHub CLI smoke without a separately approved/manual `gh` installation. QA must not install it merely to make acceptance green.

## QA requests

Please independently verify:

1. PR diff is limited to B1 tooling and contains no hidden delivery path.
2. No `codex queue`, Codex executable, GitHub write, service/scheduler/startup action or credential output can be reached.
3. Strict parsing, main-branch SHA pinning, approval record and Module 008 gate fail closed.
4. The 24 tests and project regressions reproduce.
5. The two PARTIAL rows remain truthful unless the QA host already has an independently installed/authenticated `gh`; do not install it under this handoff.

Return `ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE` with evidence. Do not modify the branch.
