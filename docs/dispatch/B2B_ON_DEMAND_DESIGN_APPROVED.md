# Personal Workspace — B2B On-Demand Notification Delivery, Design V1.1 (Revision to V1.0)

**Status:** APPROVED / DESIGN FROZEN — user explicitly confirmed one-click on-demand B2B V1.1 on 2026-11-21; **CODE-ONLY IMPLEMENTATION TO BE AUTHORIZED BY SEPARATE B2B EXECUTION INSTRUCTION**; NO INSTALLATION OR LIVE SENDING  
**Prepared:** 2026-11-21  
**Repository:** `zyyu1/personal-workspace` (private)  
**Supersedes:** This file's earlier V1.0 suggestion to use Windows Task Scheduler every two minutes. User explicitly rejected continuous background execution and requested: **“我不希望后台一直挂着，我希望只有在提出需求的时候才执行”**.  
**Approved design scope:** One-click finite local notification receiver, without any scheduler, service, daemon, polling loop or autorun. This design does not by itself authorize installation, remote activation or real `codex queue`; B2B development is allowed only under a separately scoped code-only instruction.

## 0. User intent and feasibility (the governing product decision)

**Requirement:** No always-running process, no scheduled check-ins, no network watcher, no boot/logon task and no automatic check when the user has no new request. Only invoke the bridge when the user asks to deliver a task.

**Key constraint:** Publishing an Issue on GitHub cannot, by itself, wake a Windows laptop with no locally listening process, OS notification hook, trusted remote-control endpoint or other active trigger. ChatGPT's GitHub connector can write to GitHub, **not directly execute a command on the user's Windows Desktop**. The design must not claim zero-touch, event-driven desktop delivery without identifying and independently verifying a working secure trigger channel.

**V1.1 recommendation (works without background processes):**
- Design Window writes the approved notification record and a strict v2 GitHub Issue as it already can.
- The user launches a **one-click Windows local “Receive Personal Workspace Task”** shortcut (or an equivalent deliberate on-demand local action).
- The launcher runs one bounded check and at most one accepted notification submission to the already-pinned original Codex Desktop thread, then exits automatically.
- No prompt content is manually copied; the only user action is to trigger the local receiver. The operator may verify same-thread ACK afterward.
- If the user specifically needs **even this one click removed**, propose a **separate future trigger integration** with honest security/availability tradeoffs. Do not install a listener just to approximate this requirement.

**New V1.1 scope name:** “B2B On-Demand Bridge” (not unattended polling). V1.0 continuous polling is **REJECTED AS A PRODUCT DEFAULT** and not available for implementation from this PR.

## 1. Accepted baseline

- B0 proved a safe, exact-UUID `codex queue` message can reach the existing original Codex Desktop thread (Issue #3).
- B1's read-only GitHub inbox, including Windows `cp936`-safe UTF-8 byte decoding, is accepted (Issue #4).
- B2A notification-only sender [PR #9](https://github.com/zyyu1/personal-workspace/pull/9) merged after strict JSON type validation; one real Windows queue submission on [Issue #10](https://github.com/zyyu1/personal-workspace/issues/10) returned `QUEUE_SUBMITTED` and the user **observed/copied the exact original-thread nonce ACK**. It was accepted as *human-attested*, not an automatic ACK API.
- Issue #10 is closed, its approval label removed, and its dedupe Outbox entry **must not be reset/replayed**.
- [Current B2 status](https://github.com/zyyu1/personal-workspace/blob/main/docs/dispatch/B2_STATUS.md): B2A PASS; local `dispatch_enabled=false`, B2B/B3 NOT AUTHORIZED; Module 007 NOT STARTED and Module 008 BLOCKED by independent Module 007 QA.
- Frozen B2A strict v2 notification authorization from [B2_DESIGN_APPROVED.md](https://github.com/zyyu1/personal-workspace/blob/main/docs/dispatch/B2_DESIGN_APPROVED.md) remains unchanged. This V1.1 is a proposed **new delivery trigger**, not an expanded permission to execute a handoff.

## 2. User-visible flow

```text
User submits a concrete request in Design Window
            |
            v
Design Window checks whether task is allowed, then writes GitHub
  -> approved notification record + exact source blob SHA
  -> one open Issue with strict v2 envelope and approval label
            |
            | User wants Windows to receive it now
            v
User clicks local “Receive Personal Workspace Task” (ONE ACTION)
            |
            v
Short-lived Windows process under original user
  -> one GET-only scan; validate exact approved Issue & manifest & source SHA
  -> 0 approved: report NOTHING_APPROVED and exit
  -> >1 approved: report AMBIGUOUS_APPROVAL and exit (V1.1 intentionally bounded)
  -> 1 approved: recheck under lock; durable PREPARED before send
  -> official codex queue --thread <LOCAL_PINNED_UUID> --message <FIXED_SAFE_TEMPLATE>
  -> QUEUE_SUBMITTED or UNKNOWN_DELIVERY; no auto resend
            |
            v
Original existing Codex Desktop thread
  -> eventually returns exact nonce ACK if it receives/processes the queue item
  -> human original-thread ACK reconciliation; no fabricated automatic ACK
            |
            v
Process has already exited. No service / scheduler / watcher remains.
```

No second local message submission is made on repetition: the B2A Outbox suppresses duplicate/uncertain states. “Run only when I ask” means the local receiver does nothing until the user triggers it; it does **not** mean every GitHub Issue can be treated as a task instruction.

## 3. One-shot Windows launcher requirements

- Operator-owned shortcut in user's interactive Windows account, no SYSTEM/admin/elevation, no Task Scheduler / Windows Service / logon/Startup folder / registry Run / daemon / listening port / persistent GitHub webhook server.
- The shortcut starts an installed/pinned, QA-reviewed Python receiver using an absolute path, within a trusted checked-out repository or immutable reviewed artifact; no shell interpolation, arbitrary arguments from GitHub, unattended `git pull` or auto-update.
- The user triggers a bounded **single scan, one send attempt at most, automatic exit**. No `while True`, periodic sleeps, recurrence, desktop startup registration, scheduled retry or unattended follow-up.
- Clear local output: `NO_ACTION` / `BLOCKED` / `QUEUE_SUBMITTED (NOT ACK)` / `UNKNOWN_DELIVERY`. Show only sanitized status; no full UUID, credentials, private profile path or raw Issue body.
- Reuse local pinned original Codex thread, approved official `codex.exe` path, same user checks, strict approval/expiry/sha rules, stable dedupe Outbox, one-instance lock and bytes-safe subprocess.
- **Off by default and explicit per-invocation consent.** Proposed additional in-memory one-shot consent instead of leaving `dispatch_enabled=true` on disk; this requires separate reviewed code/QA, and must not silently weaken B2A. If implementation uses temporary local enablement, it must prove fail-safe restoration after termination/crash and avoid persisting broad send permission. Never store a permanently enabled “silent receive” configuration merely because the launcher is clicked once.
- Provide an operator-controlled disable/rollback: delete only the specific optional shortcut / disable per-invocation launch. Preserve dedupe Outbox, local secret/session pin and prior Issue #10 history.
- If original thread is closed, wrong, not loaded or unverifiable, block; do not create a new thread, force resume or guess `--last`.
- Workflows requiring unsupported OS integration (e.g. GitHub → direct Windows push with no active local trigger) must be separately researched/approved; no implied automation.

## 4. Authorization and security boundaries

- **GitHub Issue remains untrusted.** Exact owner, repo, open state, approval label, strict field sets and scalar types (including `notification_authorized is True`) plus frozen `main` authorization-record SHA and handoff SHA must all match. Revalidate fresh approval immediately before durable PREPARED.
- No GitHub write API from receiver, no broad token scopes. If GitHub inaccessible, return safe non-sending status.
- Allow only `mode=probe|notify`. `mode=implement` always denied in B2B, even if a module's design exists. No direct execution of arbitrary text or shell commands.
- Fixed, bounded notification template; no Issue free prose, scripts, exfiltration URLs or untrusted Markdown injected into Codex command.
- No privilege escalation, credential exfiltration or thread ID leakage. The pinned UUID stays local.
- Exactly-once end-to-end cannot be guaranteed; enforce **at-most-one automatic submission** using local PREPARED/UNKNOWN_DELIVERY semantics. Ambiguous/timeout/crash is **not retried automatically**; manual review only.
- Queue exit zero means `QUEUE_SUBMITTED`, not `DELIVERED` or `ACK_VERIFIED`. B2B V1.1 has no automatic Codex receipt event API. Human verifies ACK in original window as in B2A.
- More than one independently approved live notice blocks by default; user or Design Window must resolve safely (no arbitrary “first issue” selection).
- Expiration/cancellation before send blocks; cancellation after queue submission cannot unsend the item.
- Local disabled/inaccessible/corrupt state, wrong owner/executable/path, unsafe ACL or lock => fail closed.
- No Module 007/008 source changes, no B3 implementation dispatch, no Task Scheduler or background services.

## 5. What remains manual vs automated

| Step | V1.1 On-Demand |
| --- | --- |
| User submits requirement to Design Window | Manual request, as desired |
| Design Window prepares reviewed authorized GitHub notification | May be handled in Design Window via GitHub connector |
| Move task text from Design Window to Codex | **No manual copy/paste** |
| Wake local Windows receiver | **One user click (or deliberate local command)** |
| Read and validate GitHub / send to original thread | Automatic, once, on demand |
| Process stays running afterward | **No** — exits |
| Detect same-thread ACK automatically | **No** — optional manual observation |
| Start module code implementation automatically | **Never in B2B**; future B3 requires distinct approval |

**Honest tradeoff:** The desired combination of “no resident listener” and “request in this remote chat automatically wakes Windows with zero local action” needs some alternative supported trusted push/invocation mechanism. None is established in B0/B1/B2A. A one-click receiver is the practical design using today's verified capabilities, without silent background execution.

## 6. Phased rollout (code-only stage separately authorized; host execution remains gated)

**Phase 1: Design APPROVED / FROZEN (2026-11-21).** No background execution, one-click Windows activation, original thread, notification-only, at-most-one send and manual ACK. No installation or live queue authorized.

**Phase 2: CODE DEVELOPMENT may proceed only under `docs/dispatch/B2B_ON_DEMAND_EXECUTION_INSTRUCTION.md`.** New branch `codex/dispatch-b2b-on-demand`, isolated receiver/shortcut packaging, unit-tested per-run consent. Reuse B1/B2A code; no scheduler. Independent Review Only QA on an unmerged PR. No real `codex queue` in development/tests.

**Phase 3: Disabled-by-default host installation review.** After QA acceptance and a new Design Window instruction, inspect a current-user optional launcher shortcut without starting it or modifying startup tasks. No daemon, service, Task Scheduler, autostart or enabled remote command API.

**Phase 4: One-shot live pilot (separate explicit authorization).** Publish a **new** notification record/Issue (never reactivate #10); operator clicks exactly once, verifies one queue submission and original-thread ACK. Confirm no process remains and no periodic activity; inspect Outbox duplicate suppression without retrying the real message.

**Phase 5: Production on-demand use (separate user approval).** Operator may use the shortcut **only when they request delivery**. No unattended operation; disable by not clicking/through local config; future design can add an independently verified platform push mechanism if feasible.

## 7. Proposed QA matrix (28 checks)

1. Original B1 GET-only interface and 47 tests remain passing.
2. Existing B2A accepted 38 tests remain passing; B2A prior host evidence and Outbox untouched.
3. Default no program/process running while idle; no service/scheduler/startup/daemon registration.
4. Launcher only starts on explicit local user action.
5. One click produces one finite bounded scan and then exits; no timer or loop.
6. Windows principal is the same original non-admin interactive user.
7. Pinned/absolute Python/script/codex executable and safe working dir; no PATH/shell injection.
8. Per-invocation enablement is explicit; no permanently enabled delivery state.
9. Crash/termination cannot accidentally leave a broadly enabled auto-trigger mechanism.
10. Only fixed repo/author and strict v2 typed Issue/record/hand-off SHA authorize.
11. Fresh revalidation before PREPARED/send; revoked/expired/closed rejects.
12. Mode `implement` denied unconditionally; notify/probe only.
13. Hostile free text never reaches fixed Codex message.
14. UUID remains local/redacted, exact original thread, no resume/last/new thread.
15. Bounded GitHub GET, offline/rate limiting/cp936 failure safely non-sending.
16. Zero eligible Issue => no send; >1 => blocked; one => eligible.
17. Lock prevents concurrent double invocation.
18. PREPARED persisted before queue attempt; fail on corrupt/unwritable state.
19. Sender once only; fixed arg array, `shell=False` and bounded output/timeout.
20. Queue 0 => QUEUE_SUBMITTED, not ACK_VERIFIED.
21. Crash/timeout/uncertain result => UNKNOWN_DELIVERY; no auto resend.
22. Repeat click cannot resend original consumed dispatch from Outbox.
23. Existing consumed Issue #10 closed/unapproved, cannot be replayed.
24. Sanitized local status, no leaking UUID, token, profile path or raw Issue body.
25. Stop/uninstall only removes explicit launcher and preserves Outbox and Codex session.
26. No GitHub writes, Git edits, Module 007/008 work, B3 code, unintended processes.
27. All actual Python/Workspace regression, compile/typecheck/lint/build/diff checks pass.
28. One new real-host pilot reaches exact original thread and human-observed nonce ACK, **NOT VERIFIED until separate post-code authorization**.

Status types: PASS / PARTIAL / FAIL / NOT VERIFIED. No fabricated live-host verification in code QA.

## 8. Required future decisions

User's newly expressed preference supersedes the background-polling proposal:
- **No background polling or auto-logon actions.**
- **Use a one-click, manual-on-demand receiver** until a secure, proven zero-local-click trigger exists.
- **No copying message text**, but an explicit local action is necessary with the verified tools.
- Keep receiver notification-only and return ACK status honestly.

**Final approval boundary (2026-11-21):** This is the authoritative frozen V1.1 design. Design Window is separately publishing `docs/dispatch/B2B_ON_DEMAND_EXECUTION_INSTRUCTION.md` and a GitHub Issue authorizing **code, mocks, documentation and independent QA only**. Do not merge the historical draft PR, install a local shortcut, invoke real `codex queue`, register any background process, activate B3, or begin Module 007/008 code based on this design approval. Host staging, one-shot real pilot and production on-demand use each require separate explicit authorization.
