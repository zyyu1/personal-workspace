# B1 Remediation Revision 02 — QA Handoff

## Candidate

- Repository: `zyyu1/personal-workspace`
- Branch: `codex/dispatch-b1-win-encoding-rev02`
- Base: `origin/main` at `4ecda0bee8a61e43d99a283857e0c6461219e3d0`
- Implementation commit: `44830f91d8a42e5ae2c4d30cb0a0cad33c9b6384`
- Authority: `docs/dispatch/B1_REMEDIATION_REV02.md` and Issue #4 authorization comment
- Review mode: independent QA, review only; do not modify the candidate

## Scope

Changed implementation paths:

- `tools/dispatch-inbox/dispatch_inbox.py`
- `tools/dispatch-inbox/tests/test_dispatch_inbox.py`
- `tools/dispatch-inbox/README.md`
- This QA handoff

No `src/`, Module 007/008, frozen design, authorization parser, data-model, service, scheduler, package, or Issue-schema changes are included.

## Behavior change

`GhApiClient` now captures `gh` stdout/stderr as bytes (`text=False`, `shell=False`). Successful API output is bounded using its actual byte length and decoded strictly as UTF-8 before JSON parsing. The adapter fails closed with sanitized reason codes for missing, empty, malformed, invalid UTF-8, oversized, or structurally invalid subprocess output. Authentication success still does not require stdout. Failed-command stderr is bounded and decoded only for sanitized classification, so missing or non-UTF8 bytes cannot crash or become trusted input.

No global code-page change, `PYTHONUTF8`, `PYTHONIOENCODING`, extra dependency, GitHub write, Codex invocation, listener, service, or scheduled task was introduced.

## Developer verification

| Check | Result | Evidence |
| --- | --- | --- |
| B1 Python unit tests | PASS | `py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v`; 47/47 passed; exit 0 |
| Python compile | PASS | `py -3.13 -m py_compile tools/dispatch-inbox/dispatch_inbox.py tools/dispatch-inbox/tests/test_dispatch_inbox.py`; exit 0 |
| TypeScript | PASS | `npm run typecheck`; exit 0 |
| ESLint | PASS WITH EXISTING WARNINGS | `npm run lint`; exit 0, 0 errors and 12 pre-existing warnings outside this change |
| Workspace tests | PASS | `npm run test`; 9 files, 104/104 tests passed; exit 0 |
| Production build | PASS | `npm run build`; exit 0 |
| Whitespace check | PASS | `git diff --check`; exit 0 before implementation commit |
| Fixture CLI | PASS | Eligible fixture returned `ELIGIBLE_DRY_RUN / VALIDATED_DRY_RUN_ONLY`; blocked Module 008 fixture returned `BLOCKED_GATE`; both exit 0 |
| Windows locale regression | PASS (simulated) | `locale.getpreferredencoding` mocked as `cp936`; UTF-8 Chinese/accented JSON decoded exactly |
| Real authenticated Windows host smoke | NOT RUN | Explicitly prohibited until independent QA acceptance and a later Design Window authorization |

The focused tests also cover `stdout=None`, empty output, malformed JSON, invalid UTF-8, absent/non-UTF8 stderr, 401/403/429/offline classifications, auth success without stdout, invalid return code, oversized byte output, and a runner-side Unicode error. Existing authorization, Module 008, SHA, Base64 LF/CRLF, read-only, and no-Codex tests remain in the same passing suite.

## Revision 02 acceptance matrix (developer self-check)

| ID | Result | Developer evidence |
| --- | --- | --- |
| R02-01 | PASS | Byte capture and explicit strict UTF-8 decoding are locale-independent. |
| R02-02 | PASS | Chinese and accented payload regression test asserts exact decoded content. |
| R02-03 | PASS | Missing, empty, malformed JSON and invalid UTF-8 stdout fail closed. |
| R02-04 | PASS | Missing and non-UTF8 stderr remain bounded and map to sanitized codes. |
| R02-05 | PASS | Auth success requires only return code; failure classification is bounded. |
| R02-06 | PASS | Actual byte bound, existing retry count and timeout behavior are retained and tested. |
| R02-07 | PASS | Existing strict authorization and Module 008 gate tests pass. |
| R02-08 | PASS | Existing LF/CRLF Base64 and Git blob identity tests pass unchanged. |
| R02-09 | PASS | Existing GET-only/no-Codex checks pass; no raw secret output was added. |
| R02-10 | PASS | Diff is limited to the four authorized B1 files; no background or business-module change. |
| R02-11 | PASS | Python, compile, typecheck, lint, build, 104 Workspace tests and diff evidence recorded above. |
| R02-12 | PARTIAL | Candidate is ready for independent QA. Real host smoke remains separately gated and was not run. |

## Independent QA request

Please inspect the actual PR/commit, reproduce the targeted adversarial cases, verify the scope and security invariants, and post one decision on the PR:

- `ACCEPTED`
- `ACCEPTED WITH FIXES`
- `REJECTED`
- `INSUFFICIENT EVIDENCE`

QA must not edit code or run the real authenticated Windows host poll. Please report the reviewed commit SHA, commands and exit codes, R02-01 through R02-12, and any concrete findings.

## Known operational limitation

B1 Revision 01 remains historically accepted, but B1 operational status remains **FAIL** until this candidate is independently accepted, Design Window explicitly authorizes a new one-time real Windows host smoke, and that later smoke succeeds. Unit and simulated-locale results are not a host-smoke PASS.
