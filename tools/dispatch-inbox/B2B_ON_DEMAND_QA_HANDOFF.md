# B2B V1.1 On-Demand Receiver — Independent QA Handoff

## Candidate

- Repository: `zyyu1/personal-workspace`
- Work order: [Issue #12](https://github.com/zyyu1/personal-workspace/issues/12)
- Frozen design: `docs/dispatch/B2B_ON_DEMAND_DESIGN_APPROVED.md`
- Execution authority: `docs/dispatch/B2B_ON_DEMAND_EXECUTION_INSTRUCTION.md`
- Branch: `codex/dispatch-b2b-on-demand`
- Accepted base: `789f663ecc6164403a791bbae162d4039240e2ed`
- Implementation commit: `ec884bae8dab9eb3b8b5c11f3310260796f8f309`
- Review mode: **Independent Review Only — do not modify, merge, install or live-send**

The PR tip includes this handoff after the implementation commit. QA must
review and test the exact PR HEAD independently and report its SHA.

## Changed files and design

- `b2_on_demand.py` — finite orchestration: explicit invocation consent,
  non-admin/current-user validation, one discovery snapshot, one locked fresh
  authorization snapshot, then the shared durable sender core.
- `b2_notify.py` — behavior-preserving extraction of the accepted B2A
  lock-internal submit core. Existing B2A still enters through
  `attempt_notification` and acquires the same lock.
- `tests/test_b2_on_demand.py` — 17 mocked on-demand regression and adversarial
  tests; no real GitHub or Codex process.
- `windows/Receive-PersonalWorkspaceTask.ps1.template` — inert source template
  with absolute Python/repository placeholders, fixed flags and no arguments.
- `README.md` — source-only operation, disable and cleanup boundary.
- `B2B_ON_DEMAND_OSS_REUSE_REVIEW.md` — required current OSS assessment.
- This handoff.

No `src/`, frozen design, Module 007/008, notification manifest, GitHub label,
real local configuration, Outbox, Desktop folder, service, scheduler or startup
location was changed.

## State machine and critical ordering

1. Missing either CLI flag returns `BLOCKED / EXPLICIT_ON_DEMAND_CONSENT_REQUIRED`
   before reading local config.
2. Persisted `dispatch_enabled` must be exactly `false`; `true` is rejected as
   `PERSISTENT_DELIVERY_ENABLE_FORBIDDEN`. Consent exists only in an immutable
   in-memory copy for this invocation.
3. Elevated execution is rejected. The accepted current user, exact local
   thread UUID and absolute non-symlink `codex(.exe)` still use B2A validation.
4. One bounded GET-only discovery snapshot yields: zero → `NO_ACTION`; more
   than one → `BLOCKED`; exactly one → continue.
5. Acquire the existing exclusive lock. While holding it, perform one fresh
   bounded snapshot and re-run the complete strict v2 record and handoff
   validation. Revocation, cancellation, expiry, network failure, multiple
   candidates or any changed `AuthorizedNotification` blocks before state.
6. Still under the same lock, the shared core fsyncs `PREPARED`, invokes at
   most one fixed sender, then records `QUEUE_SUBMITTED` or
   `UNKNOWN_DELIVERY`. Existing suppressing states never auto-resend.
7. Exit immediately. There is no wait, loop, retry, background process or
   GitHub write.

## Threat scenarios covered

- Missing consent, permanently enabled disk config, wrong/elevated user,
  unsafe UUID/executable and lock collision fail closed.
- Zero/multiple candidates cannot select or send arbitrarily.
- Authorization removed, expired or blob/nonce-changed between discovery and
  locked recheck cannot reach `PREPARED`.
- Strict B2A field types, repo/author/open-state/labels, safe paths, exact blob
  identities, `probe|notify` allowlist and unconditional `implement` denial are
  reused without a second parser.
- Untrusted Issue prose never reaches the fixed message or shell.
- Corrupt/unwritable Outbox, crash after PREPARED, queue timeout/failure and
  duplicate clicks remain fail-closed/no-retry through accepted B2A behavior.
- The closed, approval-free consumed Issue #10 cannot be discovered or replayed;
  existing Outbox data is never reset.

## Developer verification evidence

| Check | Result |
| --- | --- |
| `py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v` | PASS — 102/102 (47 B1 + 38 B2A + 17 B2B) |
| `py -3.13 -m py_compile ...` for all three tools and tests | PASS — exit 0 |
| `npm run typecheck` | PASS — exit 0 |
| `npm run lint` | PASS — exit 0; 0 errors, 12 pre-existing `src/` warnings |
| `npm run test -- --run` | PASS — 9 files, 104/104 tests |
| `npm run build` | PASS — exit 0 |
| `git diff --check` | PASS — exit 0 |
| `codex queue --help` | PASS — read-only interface inspection, exit 0 |
| Actual `codex queue` | **NOT RUN — PROHIBITED** |
| Local shortcut/scheduler/service/daemon | **NOT INSTALLED** |

All B2B sender tests use injected fake subprocess runners and temporary
directories. They do not read or write the real `%LOCALAPPDATA%` config or
Outbox.

## 28-point developer self-check

| # | Result | Evidence |
| ---: | --- | --- |
| 1 | PASS | All 47 B1 tests pass. |
| 2 | PASS | All 38 B2A tests pass; tests use temporary Outboxes and real history is untouched. |
| 3 | PASS | Receiver has no loop/idle process/scheduler; returns after bounded snapshots. |
| 4 | PASS | Both flags are mandatory; inert launcher requires deliberate future operator action. |
| 5 | PASS | Finite discovery plus one mandatory locked recheck; no automatic retry. |
| 6 | PASS | Exact configured user is retained and elevated execution is rejected. |
| 7 | PASS | Template pins absolute Python/repository/script and fixed flags; no parameters/PATH lookup. |
| 8 | PASS | Disk config must remain false; consent is immutable and process-local. |
| 9 | PASS | No persisted broad enable state exists to survive a crash. |
| 10 | PASS | Accepted strict v2 parser and exact manifest/handoff identity are reused. |
| 11 | PASS | Test asserts fresh fetch and PREPARED both occur while the same lock is held. |
| 12 | PASS | `mode=implement` remains unconditionally denied by existing tests. |
| 13 | PASS | Fixed renderer; hostile Issue prose and URL/shell content are excluded. |
| 14 | PASS | Exact local UUID only; no `--resume`, `--last` or new session path. |
| 15 | PASS | Bounded GET adapter; offline/rate/cp936 tests remain passing. |
| 16 | PASS | Zero → no action, multiple → block, exactly one → locked recheck. |
| 17 | PASS | Existing exclusive lock plus conflict and ordering tests prevent concurrency. |
| 18 | PASS | Shared Outbox writes durable PREPARED; corruption/write failures block sender. |
| 19 | PASS | Shared sender uses one fixed argument vector, `shell=False`, bounded timeout/output. |
| 20 | PASS | Exit zero is `QUEUE_SUBMITTED / NOT ACK`, never verified delivery. |
| 21 | PASS | Crash/timeout/session failure produces uncertain state and suppresses retry. |
| 22 | PASS | Repeated click test produces one fake sender call only. |
| 23 | PASS | Closed/unapproved Issue simulation cannot authorize; no Issue #10 state reset. |
| 24 | PASS | Public results exclude UUID, secrets, paths and untrusted bodies. |
| 25 | PASS | Docs remove only a future shortcut and explicitly preserve Outbox/session state. |
| 26 | PASS | No GitHub writes, Git writes in receiver, module work, B3 or background process. |
| 27 | PASS | Python 102, Workspace 104, compile/typecheck/lint/build/diff checks pass. |
| 28 | **NOT VERIFIED** | Real shortcut installation and real Windows queue pilot are expressly prohibited at code QA. |

## QA request and stop boundary

Independent QA must review the PR diff and rerun relevant checks using fake
senders only. It must specifically challenge locked revalidation ordering,
temporary consent, launcher quoting/binding, duplicate/crash state and B1/B2A
regressions. QA must not install the template, alter real config/Outbox, call
`codex queue`, write GitHub state, merge, or start B3/Modules 007/008.

Return `ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE`, the
exact reviewed PR HEAD and evidence links. Real host matrix row 28 remains
`NOT VERIFIED` until a new Design Window instruction.

**LIVE QUEUE NOT RUN / LOCAL SHORTCUT NOT INSTALLED / BACKGROUND RECEIVER NOT
ENABLED / B3 NOT AUTHORIZED / MODULE 007–008 NOT STARTED.**
