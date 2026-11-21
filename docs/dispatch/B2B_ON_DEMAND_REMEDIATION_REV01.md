# Personal Workspace — B2B V1.1 On-Demand Remediation Revision 01

**Status:** DESIGN WINDOW AUTHORIZED — SCOPED SECURITY REPAIR + MOCKED TESTS + INDEPENDENT REVIEW ONLY (2026-11-21)
**Finding:** `B2B-QA-001 / HIGH` — incomplete authorization snapshot can fail open.
**Repository:** `zyyu1/personal-workspace` (private)
**Existing PR:** https://github.com/zyyu1/personal-workspace/pull/13 — **OPEN / UNMERGED**, same `codex/dispatch-b2b-on-demand` branch.
**Rejected candidate:** `650ef85dce0549602ba20bd2d8f10835ee219e70`
**Implementation commit:** `ec884bae8dab9eb3b8b5c11f3310260796f8f309`
**Independent REJECTED QA:** https://github.com/zyyu1/personal-workspace/pull/13#issuecomment-7064833121
**Approved design:** `docs/dispatch/B2B_ON_DEMAND_DESIGN_APPROVED.md` on main, blob `26489fdd74f2dd2614522ec96d7b7038f2737be9`.
**Code-only work order:** `docs/dispatch/B2B_ON_DEMAND_EXECUTION_INSTRUCTION.md` on main, blob `55eece34badb9cdd048e7a417d136056b5f92c33`.
**Decision:** REJECT original candidate; authorize **only B2B-QA-001 remediation**, then independent review. No merge, live queue, shortcut installation or automatic trigger.

## 1. Confirmed defect and required invariant

At rejected HEAD, `tools/dispatch-inbox/b2_on_demand.py:48-62`, `_authorized_snapshot` ignores the `NotifyResult` returned from `b2_notify.validate_notification`:

```python
notification, _ = b2_notify.validate_notification(issue, source.fetch_file, now=now)
if notification is not None:
    authorized.append(notification)
```

The accepted B2A validator returns `(None, NotifyResult("BLOCKED", reason))` when a candidate's GitHub record or handoff cannot be fetched (`AdapterUnavailable`, e.g. `GH_OFFLINE`). Ignoring that status can incorrectly reduce an *unknown* candidate set to exactly one authorized candidate. This unsafe logic occurs in **both**:
- initial `receive_once` discovery snapshot; and
- full fresh snapshot **inside the existing lock** before durable `PREPARED` and the sender.

Independent QA reproduced `QUEUE_SUBMITTED`, `SENDER_CALLS=1`, `STATE_EXISTS=True` with one valid candidate + one candidate failing an authorization-record fetch. This violates fail-closed selection and the frozen design; affected QA matrix rows **#11, #15, #16**. Python 102/102 and Workspace 104/104 passing tests do not waive a High safety finding.

**Mandatory invariant:** If any candidate validation is `BLOCKED`, or if a validation result is malformed/inconsistent/unknown, the *entire* snapshot is blocked. The receiver must not choose the single apparent authorized candidate, must not write `PREPARED`, must not modify/create an outbox and must not invoke a sender. This must hold **before** AND **during** the locked recheck.

## 2. Precise classification contract

For each candidate returned by the bounded GET-only `list_open_issues()`, capture **both** values from `validate_notification(...)`; never infer completeness from `notification is None` alone.

- **AUTHORIZED_NOTIFICATION:** Accept only when the returned `AuthorizedNotification` is non-null and consistent with the result; append to the list of authorized candidates.
- **REJECTED:** Expected policy-invalid, expired, revoked, wrong author/label, or ordinary non-approved Issue. May be ignored as a **policy rejection**, provided there is no contradictory non-null authorized notification.
- **BLOCKED:** Includes any adapter/infrastructure failure (`GH_OFFLINE`, timeout, rate-limit, inaccessible record/handoff), other fail-closed security blocks, and incomplete validation. **Abort the entire snapshot**, with an appropriate sanitized `B2Error`/non-sending `NotifyResult(status="BLOCKED", ...)`. Never silently downgrade to REJECTED, `NO_ACTION` or a valid singleton.
- **Unexpected status, inconsistent tuple, unexpected per-item exception, or incomplete enumeration:** **Fail closed**; do not skip or treat as a harmless REJECTED. Preserve existing bounded adapter exception semantics and sanitized reason codes. If any unexpected error cannot be safely handled within this narrowly scoped code, report it to Design Window instead of broad exception swallowing.

**Ordering:** inspect the entire bounded candidate snapshot; if any `BLOCKED` appears, the result is blocked **regardless of valid candidate count or encounter order**. Existing outcomes remain unchanged for fully enumerated, fully readable scans: zero authorized => `NO_ACTION`, exactly one => mandatory fresh recheck under lock, more than one => `BLOCKED / MULTIPLE_AUTHORIZED_NOTIFICATIONS`. Do not weaken strict v2 authorization or B2A-QA-001 exact type checks.

**Locked recheck:** Any blocked or ambiguous result in the recheck must stop *before* `attempt_notification_locked`, without touching `PREPARED`, even if the discovery scan had exactly one authorized candidate. The lock must be safely released.

## 3. Narrow approved change scope

**Allowed:** `tools/dispatch-inbox/b2_on_demand.py`, `tools/dispatch-inbox/tests/test_b2_on_demand.py`, and `tools/dispatch-inbox/B2B_ON_DEMAND_QA_HANDOFF.md`. Only if necessary to document corrected status semantics, a small B2B V1.1 section of `tools/dispatch-inbox/README.md` may change.

**Not allowed:** modifying the accepted B1 GET client, B2A strict validator, OutboxStore, lock/sender core, B2B frozen design or execution instruction, local user config/Outbox, Windows shortcut template installation, scheduler/service/daemon, GitHub permission/Issue labels or manifests, `src/`, Modules 007/008, B3, or unrelated features. If the patch truly requires touching outside the allowed paths, **STOP and request a separate scope decision**.

Keep `codex/dispatch-b2b-on-demand` and **existing PR #13**. Before editing, verify the actual branch head is still exactly `650ef85dce0549602ba20bd2d8f10835ee219e70`; if different, stop and report potential concurrency. No reset, rebase, force-push or rewriting the original rejected QA history. Append a normal remediation commit and an updated QA handoff.

## 4. Mandatory adversarial regression

With injected fake sources, fake sender and temporary Outbox only, independently exercise **each** of the following for both initial discovery and locked recheck:

1. **Valid candidate + second candidate's notification-record fetch raises `AdapterUnavailable("GH_OFFLINE", ...)`**: `BLOCKED`, sender=0, no `PREPARED`, outbox absent or byte-identical.
2. **Valid candidate + second candidate's handoff fetch raises `AdapterUnavailable("GH_OFFLINE", ...)`**: same four invariants.
3. Repeat #1/#2 in reverse Issue enumeration order; the first encountered valid candidate does not confer authority and an earlier blocked candidate cannot be ignored.
4. Confirm a whole-snapshot `list_open_issues()` failure and a per-item adapter timeout/rate-limit/forbidden/other `AdapterUnavailable` produce fail-closed sanitized results.
5. **Discovery valid, locked recheck partially unreadable**: no `attempt_notification_locked`, no outbox write/create, no fake sender. Ensure the attempted recheck occurs **under the lock** and it is released afterward.
6. **Discovery partially unreadable**: do not enter the send lock or sender; no Outbox files are created.
7. A fully readable snapshot with a valid candidate plus one ordinary `REJECTED` issue retains the intended **one valid candidate** behavior with exactly one fake send (never a real queue call).
8. All valid candidates (0, 1, multiple) preserve their previously approved `NO_ACTION`/single safe send/`MULTIPLE_AUTHORIZED_NOTIFICATIONS` behavior.
9. Inconsistent or unexpected `validate_notification` return status does not silently select a valid candidate.
10. Persisted disk config remains `dispatch_enabled=false`, including exception paths; repeated clicks and pre-existing `QUEUE_SUBMITTED`/`UNKNOWN_DELIVERY` outbox entries suppress replay. **Never rearm closed Issue #10.**
11. Re-run B1 47 tests, B2A 38 tests and existing B2B tests; original failing independent adversarial reproducer must now fail closed.

For *all rejected/blocked malicious or incomplete snapshots*, assert **zero sender calls**; **no `PREPARED`**, **no outbox creation or mutation**, no Codex session access, and no GitHub writes. Positive fake-sender control confirms the scoped repair did not accidentally disable valid use.

## 5. Re-review, evidence and stop gate

- Run `py -3.13 -m unittest discover -s tools/dispatch-inbox/tests -v`, relevant `py_compile`, default disabled CLI, `npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run build`, `git diff --check` and existing PowerShell launcher AST check. Report actual commands, exit codes and pass counts; never invent totals.
- Update `B2B_ON_DEMAND_QA_HANDOFF.md`: original defect and QA link, exact remediation commit/new HEAD, narrowed patch locations, adversarial discovery+locked recheck before/after outcomes, protected outbox evidence, 28-point matrix, regression totals and `#28 NOT VERIFIED`.
- Request **new independent Review Only QA at the new HEAD**. Independent QA must independently reproduce original valid+unreadable-candidate exploit for **both record/handoff fetch** in **both scanning phases** and verify sender=0/outbox unchanged.
- QA must specifically reevaluate matrix **#11, #15, #16**. Other existing PASS results still need regression protection; test #28 must remain **NOT VERIFIED**, because live Windows installation and real `codex queue` are separately gated.
- Return PR URL, remediation SHA, new reviewed HEAD, changed files, exact test outputs, independent QA comment URL and decision (`ACCEPTED / REJECTED / INSUFFICIENT EVIDENCE`), then **STOP**. Design Window retains authority over code acceptance and merge.

### Non-negotiable boundaries

- **NO real `codex queue`** or newly authorized live dispatch Issue.
- **NO installed shortcut**, automatic run, background listener, watcher, scheduler, Windows service, remote wakeup or boot/logon trigger.
- **NO B3** or Module 007/008 implementation.
- **NO merge**, even if all new tests pass, before independent QA and new explicit Design Window decision.
- **B2B V1.1 remains one-click/one finite on-demand action**, not the rejected B2B V1.0 recurring poller.
- A code QA acceptance never authorizes future local installation, real-host smoke or general delivery; each requires a later separate Design Window authorization.

**Expected immediate end state:** PR #13 OPEN/UNMERGED, original REJECTED evidence preserved, Revision 01 repair authorized but not yet accepted, no real send/installation.