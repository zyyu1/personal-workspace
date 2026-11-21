# B1 Revision 01 — Independent QA Handoff

## Candidate identity

- Repository: `zyyu1/personal-workspace`
- Pull request: `#5`
- Branch: `codex/dispatch-b1`
- Original PR base: `563fd5820c77539bf130379737b38342ba70ac6e`
- Rejected candidate: `95ad61fa9fab308cb7a87c7d30929f448779874d`
- Revision 01 remediation commit: `7a6710fde4d972e4ba4fbff3ab3ff62f21c891ce`
- Revision 01 candidate head: resolve the current PR head independently; the following commit only updates this handoff.
- Original B1 instruction blob: `e908765a3d5e1a2ac640386f17af96186398b8f3`
- Revision 01 instruction blob: `c13468602d0d096d600de912f056242266b7e4a3`
- Original rejected QA: `https://github.com/zyyu1/personal-workspace/pull/5#issuecomment-7062203140`

Independent QA is **Review Only**. Do not modify the branch, merge PR #5, install `gh`, invoke Codex, start B2/B3, or implement Module 007/008.

## Revision 01 changed paths

- `tools/dispatch-inbox/dispatch_inbox.py`
- `tools/dispatch-inbox/tests/test_dispatch_inbox.py`
- `tools/dispatch-inbox/fixtures/eligible.json`
- `tools/dispatch-inbox/fixtures/blocked-008.json`
- `tools/dispatch-inbox/README.md`
- `tools/dispatch-inbox/B1_QA_HANDOFF.md`

No `src/`, frozen handoff/status file, service, scheduler, startup entry, repository setting, GitHub object, Codex session, B2/B3, or Module 007/008 implementation was changed by Revision 01.

## Blocking finding remediation

### B1-QA-001 — authorization parser fail-open

Before: generic substring searches accepted incidental `APPROVED` and `AUTHORIZED`, including `UNAUTHORIZED`.

After:

- Parses only anchored `Field: value` or documented `**Field:** value` lines.
- Duplicate field names are invalid, including case variants.
- B1 requires the exact instruction path and canonical Status, Owner and Repository fields.
- Negative/conditional records (`DRAFT`, `PENDING`, `NOT STARTED`, `UNAUTHORIZED`, `NOT AUTHORIZED`, `APPROVED?`, `APPROVED WITH CONDITIONS`, contradictory fields) fail closed.
- Numeric module implementation requires exact Module, `Status: IMPLEMENTATION AUTHORIZED` and `Implementation Authorization: ACTIVE` fields.
- Incidental prose cannot authorize implementation.

Evidence: the exact QA payload and ten adversarial/ambiguous variants do not become `ELIGIBLE_DRY_RUN`; plain and canonical Markdown B1 records remain positive.

### B1-QA-002 — incomplete Module 008 gate

Before: the substring `QA: ACCEPTED` was sufficient.

After, an 008 implementation dry-run requires all of:

1. Main-branch Module 007 status with exact `Module: 007`.
2. Exact `Independent QA: ACCEPTED` and `Implementation Acceptance: ACCEPTED`.
3. A valid `Accepted Implementation SHA` that is not the A01 baseline.
4. A safe main-branch Module 007 QA report path.
5. That report has exact Module 007, QA ACCEPTED and the same implementation SHA.
6. A bounded read-only GitHub commit lookup confirms the SHA exists in this repository.
7. Main-branch Module 008 status has exact Module 008, `Implementation: AUTHORIZED` and `Implementation Authorization: ACTIVE`.

Missing, duplicated, malformed, non-main, conflicting or unavailable evidence fails closed. The current real 007/008 status does not satisfy the documented minimum schema and therefore remains blocked; no status file was modified. A fully consistent positive scenario exists only as an isolated fixture.

Evidence covers missing/malformed/fake/conflicting SHA, `ACCEPTED WITH FIXES`, `PENDING`, A01 substitution, wrong module/ref, inactive 008 and the complete positive fixture.

### B1-QA-003 — GitHub Contents wrapped Base64

Before: strict decoding rejected GitHub's line-wrapped Base64.

After:

- Requires `type=file`, exact path, `encoding=base64`, valid 40-hex SHA and non-empty content.
- Removes only ASCII CR/LF/space/tab wrapping before strict Base64 validation.
- Bounds encoded and decoded sizes.
- Computes the Git blob SHA from decoded bytes and requires an exact API SHA match.
- Requires non-empty UTF-8 Markdown content.

Evidence covers unwrapped, LF and CRLF wrapped success plus wrong encoding/path/SHA, bad padding, invalid alphabet, empty/truncated input, invalid UTF-8 and oversized payload rejection.

## Architecture and prohibited behavior check

The poller remains an operator-invoked Python standard-library `--once --dry-run` classifier. The only external executable is a pre-existing `gh`; calls are argument arrays with `shell=False` and read-only GET methods. The added commit check is `GET repos/zyyu1/personal-workspace/git/commits/<sha>`.

There is no Codex executable path, queue/exec/app-server call, GitHub mutation, inbound socket, service, scheduler, startup entry, watcher or automatic implementation route. Output remains sanitized and bounded.

## Commands and observed results

| Command | Exit | Result |
| --- | ---: | --- |
| `py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v` | 0 | 40/40 passed |
| `py -3.13 -m py_compile tools/dispatch-inbox/dispatch_inbox.py tools/dispatch-inbox/tests/test_dispatch_inbox.py` | 0 | Passed |
| Eligible fixture | 0 | `ELIGIBLE_DRY_RUN / VALIDATED_DRY_RUN_ONLY` |
| Blocked 008 fixture | 0 | `BLOCKED_GATE / MODULE_007_QA_NOT_ACCEPTED` |
| `npm run typecheck` | 0 | Passed |
| `npm run lint` | 0 | 0 errors; 12 pre-existing warnings in `src/` |
| `npm run test` | 0 | 104/104 passed, 9/9 files |
| `npm run build` | 0 | Passed |
| `git diff --check` | 0 | Passed |
| Real Windows `--once --dry-run --no-receipts` | 2 | Expected `UNAVAILABLE / GH_NOT_INSTALLED` |

No dependency was installed. Authenticated private-repository polling remains unverified on this Windows host and is not represented as a pass.

## Revision 01 acceptance matrix

| # | Status | Evidence |
| ---: | --- | --- |
| 1 | PARTIAL | GET-only adapter and GitHub Contents realism tests pass, including wrapped Base64 and blob identity. Real authenticated private-repo polling remains unavailable because `gh` is absent. |
| 2 | PASS | Wrong account rejected. |
| 3 | PASS | Missing approval label rejected. |
| 4 | PASS | Exact schema/version and unknown-field rejection. |
| 5 | PASS | Traversal, external URL and non-Markdown paths rejected. |
| 6 | PASS | Main ref, exact path and Git blob SHA checks; mismatch tests pass. |
| 7 | PASS | Timezone-aware expiry validation. |
| 8 | PASS | 008 gate now requires exact 007 acceptance/SHA/report/commit and explicit 008 activation; all incomplete cases block. |
| 9 | PASS | Canonical valid fixture is `ELIGIBLE_DRY_RUN`; no delivery path exists. |
| 10 | PASS | Composite Issue ID + dispatch ID receipts remain atomic, bounded and duplicate-aware. |
| 11 | PASS | Missing CLI, timeout, rate/auth/offline/malformed/oversize failures use bounded sanitized codes. |
| 12 | PASS | Page, item, response, file-size, retry and timeout bounds remain enforced. |
| 13 | PASS | Only local fixtures/receipts plus outgoing read-only GitHub calls; no listener/elevation. |
| 14 | PASS | Spy/static review confirms no Codex subprocess. |
| 15 | PASS | Adapter exposes only GET reads; no Issue/PR/comment/label writes. |
| 16 | PASS | No service, scheduler, startup, watcher or installation behavior. |
| 17 | PASS | Revision diff is confined to approved B1 tooling paths; no `src/` or module implementation changes. |
| 18 | PASS | 40 Python tests, py_compile, TypeScript, build, 104 project tests and diff check pass; lint has 0 errors. |
| 19 | PARTIAL | Real Windows smoke correctly remains `GH_NOT_INSTALLED`, exit 2; `gh` was not installed or authenticated. |
| 20 | PASS | README documents strict authorization/gate schemas, safe operation, troubleshooting, disable/uninstall and B2/B3 gates. |

Self-check summary: **18 PASS / 2 PARTIAL / 0 FAIL / 0 NOT VERIFIED**. Independent QA must decide acceptance; this document does not self-approve B1.

## Required independent re-review

Please independently reproduce:

1. The original `UNAUTHORIZED` authorization exploit and added contradictory/malformed variants.
2. `QA: ACCEPTED` without an accepted implementation SHA, fake/mismatched SHA, A01 substitution and inactive 008 authorization.
3. GitHub-style LF/CRLF wrapped Base64 plus malformed content, encoding, UTF-8, size and SHA cases.
4. The no-Codex/no-GitHub-write/no-service boundaries and the entire 40-test/project regression suite.
5. The environmental limitation: do not install `gh`; acceptance #19 remains PARTIAL unless it is independently already available and authenticated.

Return `ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE` and publish the conclusion on PR #5 without modifying code.
