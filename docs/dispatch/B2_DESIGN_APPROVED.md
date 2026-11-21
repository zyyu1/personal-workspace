# Personal Workspace — B2 GitHub → Windows Codex Existing-Session Notification Delivery V1.0

**Status:** APPROVED / DESIGN FROZEN — user confirmed 2026-11-21; **B2A CODE DEVELOPMENT AUTHORIZED BY SEPARATE EXECUTION INSTRUCTION ONLY**; NO LIVE DELIVERY, UNATTENDED POLLING, B2B OR B3 AUTHORIZATION  
**Prepared:** 2026-11-21  
**Repository:** `zyyu1/personal-workspace` (private)  
**Design phase:** B2 (after B0 targeted-thread probe and B1 read-only classifier operational PASS)  
**Product goal:** After Design Window creates an authorized GitHub notification, a Windows-side user-scoped dispatcher forwards a **fixed-format notification** to the **same existing Codex Desktop execution conversation**, without manually copying prompts.  
**Explicit limit:** B2 can notify and request an ACK; **B2 must not start implementation, perform Git writes, auto-merge, alter module status, or enable an agent execution workflow**. B3 (gated implementation) is a separate future design/approval.

## 0. Established facts and non-goals

- B0 [Issue #3](https://github.com/zyyu1/personal-workspace/issues/3) proved a harmless `codex queue --thread <exact_UUID> --message <fixed_message>` can reach the **existing, active Windows Codex Desktop thread**, sometimes only after its current turn finishes. No `--resume` required in that test. CLI exit 0 alone is **not** proof of delivery or ACK.
- B1 [PR #5](https://github.com/zyyu1/personal-workspace/pull/5), [PR #6](https://github.com/zyyu1/personal-workspace/pull/6), and [Issue #4](https://github.com/zyyu1/personal-workspace/issues/4) establish a QA-accepted, real Windows `cp936`-tested **read-only GitHub Issues classifier**, with no Codex process calls. Real one-time poll: exit 0; ordinary Issue rejected `APPROVAL_LABEL_MISSING`, as intended.
- `tools/dispatch-inbox/dispatch_inbox.py` currently implements bounded `gh api --method GET` reads, exact `main` blob SHA checks, scope/author/label validation, strict authorization parsing, Module 008 QA/accepted commit gate, local receipts, and `--once --dry-run`. **Preserve B1 behavior and all 47 accepted tests.**
- Module 007 STATUS: `Implementation: NOT STARTED / QA: PENDING`. Module 008 STATUS: `Implementation: NOT STARTED — BLOCKED BY MODULE 007 QA`. No B2/B3 or 007/008 code starts are implied by this document.

### B2 goals

1. The Design Window creates a specifically approved, short-lived GitHub **notification Issue**; an explicitly enabled local dispatcher receives it without manual prompt forwarding.
2. The dispatcher verifies exact repository/author, schema, label, frozen blob, design notification permission and expiry before sending any message.
3. The message goes only to the **pinned, pre-verified UUID** of the original Windows Codex Desktop execution thread; it never creates a new thread, guesses `--last`, or edits the local Codex database.
4. A durable local state distinguishes **queued** from **visible in the target conversation** and **acknowledged**; it does not silently retry uncertain deliveries.
5. No contents of an Issue or externally linked resource are ever sent as an unrestricted prompt or executed as shell code.
6. Complete opt-out/stop and accurate GitHub audit; availability failures never transform a blocked module into an approved implementation.

### B2 non-goals

- Automatic code implementation, QA execution, merges, deployments, auto-approval of Module 007/008, multi-agent orchestration, unrestricted Windows access, remote agent service, arbitrary webhooks, inbox-driven shell scripts, malicious-prompt execution, local Codex thread DB scraping, or guaranteed wakeup when Desktop is closed.
- Do not build a generic task scheduler, a cloud backend, or a new ChatGPT/Codex conversation.

## 1. Proposed architecture and trust boundaries

```text
Design Window (connected GitHub account)
  └── Approved, SHORT-LIVED notification Issue + pinned approved main-branch handoff SHA
        │
        ▼ outbound HTTPS only
Windows process under SAME user as Codex Desktop
  ├── B1 read-only GitHub classifier (retained and unchanged semantics)
  ├── B2 notification-only policy + locally pinned config
  ├── Durable single-delivery outbox / one-instance guard
  └── Official codex queue --thread <PINNED_UUID> --message <FIXED_TEMPLATE>
        │
        ▼ queued, not necessarily delivered immediately
Existing Windows Codex Desktop thread
  └── Respond "PWS-B2-ACK <DISPATCH_ID> <NONCE>" (no code writes)
        │
        ▼ independently observed ACK evidence
Manual QA / controlled GitHub Issue report -> Design Window verification
```

**Two independent trust boundaries:** (1) remote GitHub Issue is untrusted input even in a private repo, and (2) `codex queue` process success means the queue accepted an item, *not* that the exact Desktop thread processed it. A GitHub comment claiming ACK is likewise only a report until tied to evidence from the target thread.

### Reference implementation fit

- Keep B1 parser/GET adapter as the baseline. Add B2 notification policy and queue sender in a **new isolated layer** under `tools/dispatch-inbox/` rather than changing `--once --dry-run` to send messages.
- B1 supports `schema_version=1`, `mode=probe|notify|implement`; B2 must **not** blindly treat every B1 `ELIGIBLE_DRY_RUN` as permission to queue. It needs an additional, separately approved notification authorization.
- The current frozen Module 008 design header uses `APPROVED / DESIGN FROZEN`; the old B1 `_authorization_reason` for a module notification expects the exact key `Design: APPROVED`. **Do not weaken the implementation authorization matcher or edit frozen 008 documents to work around this.** Instead introduce a dedicated B2 notification authorization record / explicit exact notification validator on `main` that does **not** activate `Implementation Authorization`.

## 2. GitHub notification authorization contract

### Preferred controlled channel (proposed)

- Use private repo GitHub Issues as an **inbox**, not open comments/PR discussions as a command channel.
- A **Design Window-owned** authoritative **notification authorization record** in `docs/dispatch/notifications/` on `main` binds:
  - exact `dispatch_id`, `schema_version`, `mode=notify|probe`, `module`, `repo`, `handoff_path`, `handoff_blob_sha`, `expires_at`, and a fixed notification template/version;
  - `notification_authorized=true` with explicit Design Window approval (authorization to notify only);
  - a one-time nonce, no target-session UUID, no secret.
- An Issue is only a *pointer* to the authorized record (same exact `dispatch_id` + blob SHA) and must pass author `zyyu1`, label `dispatch:approved`, open state, explicit expiry and fixed trusted repository.
- Compare the authorization record and canonical handoff file against immutable Git blob SHAs and expected `main` path. Stale or changed `main` content, ambiguous approval, duplicate ID, expired Issue, missing authorization, or mismatched fields => **reject without queue send**.
- The sender recognizes **only** `probe` or `notify`; `mode=implement` remains **not supported in B2**, even with labels or a fully accepted 007 QA report.
- Enforce `module` allowlist, including a notification about the approved design of 008 **without** implying its implementation is allowed. The fixed message must explicitly state the module's implementation gate when not accepted.
- Labels/authorship by themselves cannot be relied upon as sufficient authorization because the same account may edit labels and Issues. Protected branch / PR reviews for dispatch authorization manifests are strongly recommended; if they are not enabled, log this residual single-account risk. **Do not misrepresent a Markdown field as a cryptographic signature.**

### Example envelope (illustrative only; invalid as an actual dispatch)

```json
{
  "schema_version": 2,
  "dispatch_id": "PWS-B2-EXAMPLE-001",
  "mode": "notify",
  "module": "008",
  "repo": "zyyu1/personal-workspace",
  "notification_record_path": "docs/dispatch/notifications/PWS-B2-EXAMPLE-001.md",
  "notification_record_sha": "<EXACT_40_HEX_BLOB_SHA>",
  "handoff_path": "docs/handoffs/008/EXECUTION_INSTRUCTION.md",
  "handoff_blob_sha": "<EXACT_40_HEX_BLOB_SHA>",
  "created_by": "zyyu1",
  "expires_at": "2026-12-01T00:00:00+01:00",
  "requires_human_approval": false
}
```

Schema v2 is **proposed, not implemented**. Validation must reject all extra/missing fields and not change B1 v1 fixtures. No target UUID, passwords, PAT, shell snippets, free-text prompt or executable flags in the Issue. Final schema and how to record Design Window sign-off must be approved before implementation.

### Naming and statuses

Proposed local/GitHub labels: `dispatch:approved`, `dispatch:notify`, `dispatch:cancelled`; optional operator-only `dispatch:acknowledged`. **Never accept label changes alone as evidence that Codex executed a task.**

User-facing states:
- `DISCOVERED` — candidate found; no auth decision;
- `REJECTED`, `BLOCKED`, `EXPIRED`, `CANCELLED` — terminal/no queue;
- `AUTHORIZED_NOTIFICATION` — approved for notification only;
- `PREPARED` — durable intention recorded before invoking queue;
- `QUEUE_SUBMITTED` — CLI returned success; **not** delivered/ACKed;
- `UNKNOWN_DELIVERY` — crash/timeout/unverifiable queue return; **no automatic resend**;
- `ACK_REPORTED` — operator manually recorded nonce match; not automatic proof;
- `ACK_VERIFIED` — QA/design checked evidence of the correct thread receiving/replying;
- `COMPLETE` — notification-only workflow closed.

## 3. Local Windows execution design

- Run under the same non-administrator Windows user as Codex Desktop. Use existing Python >=3.11, official `gh`, and official `codex` executable; pin binary path and expected minimum tested version. Do not add an HTTP server, external port, privileged service, arbitrary shell, or third-party session-controller.
- Local settings under current user's `LOCALAPPDATA/PersonalWorkspace/dispatch-inbox/`, protected by ordinary user ACL:
  - `enabled=false` by default, `notification_only=true`;
  - exact repo/expected author, pinned verified session UUID (never in GitHub, stdout or logs);
  - fixed Codex executable path; pin expected working directory/owner, optional session fingerprint; queue sender refuses missing/stale UUID;
  - interval default 120 seconds (minimum 60), timeout, backoff, one active dispatcher lock;
  - log retention and local emergency disable switch.
- Initial B2A mode is **foreground, user-supervised** and explicitly enabled for a one-time probe. Automatically scheduled/background polling is a **separate opt-in B2B gate** after independent QA and B2A real-host ACK proof.
- B2B (future, not authorized) may use a single Windows Task Scheduler entry scoped to the current user at logon, only after a separate user approval and documented disable/uninstall path; no SYSTEM service.
- After B0's verified behavior, `codex queue --thread <UUID> --message <FIXED_STRING>` may queue while a turn is active and be delivered after it finishes. **B2A will not use `--resume`**, will not create a replacement session and will not bypass busy/locked state.

### Fixed, bounded Codex notification template (no untrusted issue prose)

```text
PWS-NOTIFICATION <DISPATCH_ID> <NONCE>
Source: zyyu1/personal-workspace Issue #<NUMBER>
Mode: NOTIFICATION ONLY
Approved main-branch handoff: <SAFE_PATH>
Expected blob: <40-hex SHA>
Module implementation status: <VERIFIED_CANONICAL_STATUS>
Action: verify the referenced GitHub handoff and reply exactly
"PWS-B2-ACK <DISPATCH_ID> <NONCE>".
Do not edit files, run Git writes, start Module 007/008, create PRs, or execute the handoff.
Development instructions require a new, separately authorized B3 dispatch.
```

The values are validated identifiers and a **safe, fixed-format path**, never arbitrary Issue body text. In B2, even an authorized module notification is just a read/ack request.

## 4. Durable outbox and exact-once safety

**Important: exactly-once end-to-end delivery cannot be guaranteed solely by `codex queue`.** B2 is designed for at-most-one automatic submission per job, with manual reconciliation on uncertain outcomes.

- Deduplication key = `(repository, GitHub issue_number, dispatch_id, authorization_blob_sha)`; only one pinned target thread per local installation.
- Before invoking queue, acquire a single-instance lock and **durably write PREPARED** (atomic temp write, flush/fsync, replacement). The B1 duplicate-receipt set cannot be treated as queue-delivered evidence.
- Invoke the official CLI once with argument vector and `shell=False`, strict executable allowlist and fixed short message; capture bytes and decode safely on Windows `cp936`.
- On CLI exit 0 mark `QUEUE_SUBMITTED`; neither this nor a locally emptied queue is sufficient to mark `ACK_VERIFIED`.
- On crash, timeout, failed persist, ambiguous exit or restart after PREPARED, mark `UNKNOWN_DELIVERY`; **never automatically resend**. Manual operator review may explicitly clear/requeue after checking the real thread.
- On reboot/repeated poll, `PREPARED`, `QUEUE_SUBMITTED`, `UNKNOWN_DELIVERY`, `ACK_REPORTED`, `ACK_VERIFIED` all suppress duplicate automatic send. No replay from an edited Issue or changed SHA.
- An expired/cancelled Issue before send is blocked; cancellation after queue submission is **best effort only**, and must not be presented as revoking a message already queued in Codex.
- Queue submission requires locally enabled delivery; setting `enabled=false` aborts future sends, with an explicit stop/kill switch. Do not automatically call CLI to clear or manipulate existing threads.
- Receipt corruption, local disk full, missing ACL, PID lock or inability to persist PREPARED = **stop safely, no queue**.

## 5. ACK, evidence and GitHub writing boundary

The B0 proof was a human-observed exact reply in the original Codex thread. **The B1 GitHub API is GET-only.** B2 should preserve that until its own independent QA.

- **B2A:** Operator/QA visually checks the **same** Desktop conversation for `PWS-B2-ACK <DISPATCH_ID> <NONCE>`, records a redacted, manually posted report to the matching GitHub Issue (not written by the poller), and Design Window independently assesses this evidence.
- Do not inspect Codex's undocumented SQLite/rollout files or assume another ChatGPT session can automatically read this Windows thread.
- Without a documented, tested, authenticated local thread event API, a generic script cannot reliably confirm `ACK_VERIFIED`. Therefore **automatic ACK posting from the listener is out of scope for B2A**. If a supported API is discovered, return for design approval before adding it.
- **B2B (future):** Optional tightly scoped GitHub Issue comment writes for `QUEUE_SUBMITTED` and `UNKNOWN_DELIVERY` are a **separate privilege and authorization decision**. Do not grant the listener full repository write/admin permissions solely for status updates, and never declare `ACK_VERIFIED` based on a queue exit code.
- This means user effort can be eliminated for notification receipt, but fully automatic cross-window ACK confirmation is not promised until a verified channel exists.

## 6. Threat model and deny cases

Threats: stolen GitHub account/token; a forged `dispatch:approved` label; malicious Issue body prompt injection; user misclick/duplicate approval; stale handoff SHA; revision on `main`; session UUID loss/reuse; queued-but-not-processed turn; network retries; Windows crash after queue submission; leaked UUID/keys in logs; denial of service via many Issues; compromised GitHub CLI PATH; unauthorized code execution by an overly broad message.

Controls:
1. Immutable `dispatch_id` + frozen handoff/authorization blob SHA + expiry; precise author/repo/label allowlist; no arbitrary Issue body in Codex message.
2. B2 **mode allowlist = probe/notify only**; all `implement` requests blocked unconditionally. Never infer B3 from `IMPLEMENTATION AUTHORIZED` in a document.
3. Enforce current repo and authoritative main snapshot. Treat `main` branch protection/approval control as a critical hardening recommendation.
4. Secret/session UUID only on local Windows account; no shared cloud storage of private thread identifiers.
5. Named executable pinning, argument-array subprocess, no shell, bounded outputs/timeouts and `cp936` regression tests.
6. One-instance lock; send-once write-ahead log; no automatic retry after uncertain queue result.
7. No auto-install, no elevated account, no inbound socket/remote command execution.
8. No actions from unknown `created_by`, closed/expired Issues, missing or contradictory labels, missing record, wrong source SHA, blocked module *implementation* requests, malformed Unicode/JSON/Base64 or unavailable authentication.
9. No auto-start of either Module 007/008 even if the notification is about them.
10. Independent QA in Review Only before every deployment or privilege expansion.

## 7. Phased rollout and acceptance

### Stage B2-Design (NOW)
- **DESIGN COMPLETED / FROZEN (2026-11-21):** Design constraints, machine-readable notification contract, local state diagram and acceptance tests approved. No live Issue, installation, queue submission or unattended polling was authorized by design approval alone.

### Stage B2A — Supervised notification-only capability (code development authorized by scoped B2A instruction; live probe still separately gated)
- Implement isolated delivery layer on a fresh `codex/dispatch-b2a` branch, preserving B1 default read-only invocation and its previous 47 tests.
- Add safe synthetic fixtures, mocked Codex subprocess tests, reversible `--notify-once` explicit opt-in, disabled by default.
- Independent QA reviews code and confirms all B2 constraints; no real message until QA accepts and Design Window separately authorizes **one** live notification-only probe.
- Run one real Windows Desktop single-message smoke with pinned UUID and fixed nonce. Operator/QA verifies exact existing window ACK. No module coding. Any ambiguous/failed delivery must stop without automatic retry.

### Stage B2B — Optional unattended notification polling (NOT YET AUTHORIZED)
- After B2A passes, design/QA review a Windows logon user task or supervised foreground watcher, retry/busy behavior, shutdown/uninstall and limits.
- User explicitly enables local sending and approves cadence/startup; no install as SYSTEM; no default auto-start.
- End-to-end test must include scheduled recurrence, reboot, failed network, duplicate Issue, cancellation, expiry, corrupted receipts, session unavailable, same-thread delivery, and audit evidence.
- Even in B2B, **message content remains NOTIFICATION ONLY**. B3 is required for automated implementation instructions.

### Separate future B3
- Only when a separately approved implementation handoff exists and dependencies are QA-accepted: scoped implementation dispatch may be considered. No code or authorization for B3 is contained here.

### Proposed 24-point QA matrix (PASS / PARTIAL / FAIL / NOT VERIFIED)

1. B1 `--once --dry-run` retains exact read-only behavior and 47-test regression.
2. Only approved notification/probe mode can reach queue; `implement` always blocked.
3. GitHub Issue author/repo/state/label verified; label alone insufficient.
4. Dispatch authorization manifest and handoff content SHAs match exact main content.
5. Missing/ambiguous/expired/cancelled record fails closed.
6. Wrong module and stale or changed approved SHA rejected.
7. Module 008 notification cannot be confused with Module 008 implementation authorization.
8. Zero untrusted prose, shell snippet or arbitrary URL from Issue reaches CLI message.
9. Pinned target thread UUID remains local and is never logged or published.
10. Missing/wrong/closed target UUID yields safe state; no guessed `--last` or new session.
11. Windows command uses official executable, argument array, `shell=False`, fixed message.
12. Queue exit 0 becomes QUEUE_SUBMITTED, never ACK_VERIFIED.
13. Visible exact-UUID matching reply is necessary for ACK_VERIFIED.
14. Duplicates/repeated polling suppress queue resubmission.
15. Crash between PREPARED and command result leads UNKNOWN_DELIVERY, no auto retry.
16. Process lock prevents two pollers sending the same dispatch simultaneously.
17. Restart/offline/cp936 handling is bounded, with safe, sanitized diagnostics.
18. Disk full/corrupt state/failed fsync prevents queueing.
19. Cancellation/expiry/disabled switch before send blocks; after queue best-effort caveat visible.
20. No GitHub write API from B2A poller, no PR merge/branch push from dispatcher.
21. No service/scheduler/autostart in B2A; B2B requires separate opt-in.
22. No Module 007/008 source edits or work as a side effect of probe.
23. Typecheck/lint/build/Workspace regression, Python tests, mocked runner pass truthfully.
24. After separate live authorization, same Desktop conversation ACK is independently evidenced; otherwise mark NOT VERIFIED.

## 8. Open design choices for user confirmation

**Approved defaults** (change only by an explicit future design amendment):
- **Delivery policy:** B2 = notifications only; module implementation remains B3.
- **First deployment:** supervised foreground `--notify-once` and a single harmless test; add unattended polling only after B2A QA.
- **Operating target:** one exact existing Windows Codex session UUID on one device (reconfigurable manually, not via a GitHub Issue).
- **Frequency if B2B enabled:** every 120 seconds, minimum 60 seconds.
- **ACK:** exact nonce observed in original thread, manually reported in B2A; machine-read auto ACK requires a separately verified local API.
- **Issue write permission:** absent in B2A, optional narrowly scoped in later B2B only after independent approval.
- **Implementation gating:** 008 remains blocked by 007 independent QA acceptance; notification is not a bypass.

## 9. GitHub OSS reuse research (snapshot; verify again before coding)

| Candidate | GitHub Stars (approx, 2026-11-21) | Last commit independently observed (UTC) | License | Stack / integration & deployment difficulty | Reuse and change cost / risk |
| --- | ---: | --- | --- | --- | --- |
| [openai/codex](https://github.com/openai/codex) | ~136k | 2026-11-21 | Apache-2.0 | Rust; official CLI; **Low** to invoke installed `codex queue`; **High** to fork | **Direct reuse of official queue interface**; do not fork or mutate local session DB. Queue ack semantics, loaded/busy/offline threads and CLI version coupling are risks; B0 proved one live scenario only. |
| [cli/cli](https://github.com/cli/cli) | ~47k | 2026-11-20 | MIT | Go; official GitHub CLI; **Low** (already installed and authenticated on Windows) | **Direct reuse `gh api`** and B1 adapter; add only necessary manifest reads. Token permissions, rate limit and host locale are known risks; B1 Rev02 fixes UTF-8 bytes. |
| [songyb111-gachon/codex-auto-resume-windows](https://github.com/songyb111-gachon/codex-auto-resume-windows) | ~93 | 2026-11-21 | MIT | Windows-focused Python/app; **Medium–High** to integrate | **Reference only** for same-thread/Windows operational considerations; it targets quota-related auto-resume, **not** signed GitHub task delivery. Do not install/fork; version-coupled daemon/control details are high risk. |

Star numbers are approximate public snapshots, not exact immutable counts. Commit dates and LICENSE were checked through GitHub. The main reusable components are the **already installed official Codex CLI, GitHub CLI and our QA-accepted B1 code**. B2 does not require another framework or a cloud server.

## 10. Review and approval boundary

**Design status:** APPROVED / DESIGN FROZEN on 2026-11-21. The historical draft branch/PR remains a preserved proposal; the authoritative approved design is `docs/dispatch/B2_DESIGN_APPROVED.md` on `main`. Publication of the scoped `B2A_EXECUTION_INSTRUCTION.md` is authorized. Do not create a live `dispatch:approved` Issue from the illustrative schema or transmit any real Codex message before B2A independent QA and a new explicit one-time live-probe approval.

**Confirmed design choices:**
1. B2 is **notification-only**, with no implicit permission to implement.
2. **B2A comes first:** develop a supervised, disabled-by-default one-time notification path, then obtain independent QA and separate authorization for one live Windows smoke. **B2B remains blocked** until its own user/design approval.
3. Bind an exact existing Codex Desktop thread UUID locally, and do not treat queue submission as verified delivery. Manual evidence of the correct-thread ACK is required for B2A.
4. Use an explicitly Design Window-authorized and Git-blob-pinned notification manifest; branch protection and review controls are recommended safeguards. Without verified enforcement, a residual same-account approval risk must be disclosed, not called cryptographically signed.

**Execution boundary:** The Design Window may publish `B2A_EXECUTION_INSTRUCTION.md` and task Issue for a Development Window to implement **B2A code only**, submit PR and request independent Review Only QA. **No real `codex queue` submission, unsupervised polling, B2B/B3, background setup or Module 007/008 application coding** is authorized by this frozen design.
