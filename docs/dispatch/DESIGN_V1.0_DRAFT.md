# Personal Workspace — GitHub Inbox + Windows Codex Listener V1.0

**Status:** DESIGN DRAFT / NO AUTOMATION ACTIVE / NO CODING AUTHORIZED
**Decision:** Plan B — retain current Windows Codex Desktop execution conversation; do not create a new coding session.
**Repository:** zyyu1/personal-workspace (private).
**Prepared:** 2026-11-21
**Scope:** GitHub dispatch inbox, local Windows receiver, receipt/QA audit, safe smoke test. NO Module 008 execution.
**Dependency:** 007 currently `Implementation: NOT STARTED / QA: PENDING`; 008 currently `NOT STARTED / BLOCKED BY MODULE 007 QA`.

## 1. Capability conclusion and limitations

OpenAI officially documents `codex queue --thread <UUID> --message "<TEXT>"` to send a text message to an existing Codex conversation. `--resume` may attempt to resume an unloaded thread when a local daemon or selected server is running; it may warn and still exit successfully on failure. Also available: `codex doctor`, `codex agents`, app-server `thread/resume`/`turn/start`. These are different interfaces; no undocumented Desktop UI input injection, local database editing, or UI click automation.

**NOT YET VERIFIED ON USER'S WINDOWS HOST:** installed Codex version, `queue` availability, selected session UUID, running background service, existing Desktop thread ownership, actual delivery and visible reply. The first action is an explicit read-only local probe. Do not say the existing session has already received anything.

### Official sources (check version locally)
- https://learn.chatgpt.com/docs/developer-commands
- https://learn.chatgpt.com/docs/cli/reference
- https://learn.chatgpt.com/docs/app-server

Potential Windows limitations: existing Desktop thread may be busy, not loaded, locked by another writer, or queue may only deliver on later activity. A queue command's exit code is **not** delivery acknowledgement. If `--resume` prints a warning, record undelivered even if exit status is zero.

## 2. GitHub inbox: choose GitHub Issues, not executable files

Private repo GitHub Issues act as a durable **notification/dispatch queue**. Design Window may create a dispatch Issue via its GitHub connector; it cannot directly send a message into an open Desktop session from this ChatGPT thread. The **Windows listener** will be the actual local sender, after local validation.

Use an Issue (not arbitrary pull-request text) with labels:
- `dispatch:probe` — harmless capability test, no business-code changes.
- `dispatch:proposed` — design notice only, no auto-execution.
- `dispatch:approved` — approved handoff notification; still enforce independent module gate.
- `dispatch:blocked` — prerequisite unmet, never send implementation instructions.
- `dispatch:delivered`, `dispatch:acked`, `dispatch:failed`, `dispatch:cancelled` — operational state / immutable response comment.

**Label text is not authorization by itself.** Validate via GitHub API the issue author, permitted account, repo identity, body version, SHA, and an explicit user-approved dispatch record. All changes are audited as GitHub comments. Use Issue state and GitHub numeric issue id to deduplicate; do not rely on titles or timestamps alone.

### Machine-readable dispatch contract (future implementation)

Fields: `schema_version=1`, `dispatch_id`, `mode=probe|notify|implement`, `module`, `repo`, `handoff_path`, `handoff_blob_sha`, `gate_status`, `target_branch`, `created_by`, `expires_at`, `requires_human_approval`.

- The Issue is **untrusted input**. Parse strictly against a schema. Reject unknown modes, extra shell arguments, malformed paths, unknown authors, unexpected repo/branch, expired jobs and duplicates.
- Resolve the **authoritative instruction file on the protected main branch** and verify its blob SHA. Do not interpolate any Issue body into a shell, command line flag, environment variable, or arbitrary prompt.
- Target session UUID is configured **locally on Windows**, never in a public/readable repository file or issue. Pin the exact UUID (not `--last` or a shared session name).

## 3. Windows receiver design

Execution target: the same Windows user account that runs Codex Desktop, no administrator/SYSTEM service. Local background task may be Windows Task Scheduler every 1–2 minutes, or a tray process after separate approval. Listener only makes outgoing GitHub requests (HTTPS) and invokes installed, verified `codex` binary with a fixed allowlist of arguments. Do not expose a listening network port or enable unsafe WebSocket servers.

**Transport:** `gh api` (official GitHub CLI) using Windows Git Credential Manager / authenticated user session. Never store a PAT or OpenAI key in repository text, logs, Issue comments, Task Scheduler command line, or Windows environment printouts.

**Local-only configuration:** pinned repository `zyyu1/personal-workspace`, allowed GitHub author `zyyu1`, chosen Codex Session UUID, exact Codex binary location, expected local project path, minimum polling interval, `dispatch_enabled=false` by default, local state/receipt database under the user's application-data directory, minimal ACL.

**Process algorithm:** poll -> fetch eligible Issues -> validate author/approval/sha/gate -> acquire single-instance lock -> record PENDING locally -> invoke `codex queue --thread <exact_UUID> --message <fixed_short_text>` -> record SENDING / QUEUED -> wait for an explicit response in the exact original Codex session -> verify acknowledgement ID -> post sanitized result to Issue -> mark ACKED. Retry with backoff if network unavailable; distinguish QUEUED, DELIVERED, ACKED, FAILED, NOT_LOADED. Do not re-send a job whose ACK exists. Log only task IDs/timestamps/receipt codes, not secrets or entire documents.

For unloaded threads, `codex queue --resume` is **optional** and must first pass separate local compatibility testing. A zero exit code or queue storage is not proof of wakeup. Do not force-start alternative Codex sessions. A later reader can request manual resume if needed.

**Fixed notification content:**
"Personal Workspace dispatch <dispatch_id> received from approved GitHub Issue #<number>. Mode <mode>. Read only the confirmed main-branch handoff after validating its SHA. Before any coding, check module STATUS and independent QA gate. For probe, do no writes and reply: PWS-DISPATCH-ACK <dispatch_id>. Never begin 008 while 007 QA is pending."

Only mode=implement with actual design authorization AND independently accepted dependency + user-approved dispatch may instruct a coding turn; initial design supports **manual-confirm before code**, while notifications may auto-deliver after smoke test approval.

## 4. Non-destructive compatibility test (before implementing listener)

Local checks to run on Windows, with original Codex window **open** and no business code modified:

~~~powershell
Get-Command codex -ErrorAction SilentlyContinue | Select-Object Source
codex --version
codex queue --help
codex doctor
Get-Command gh -ErrorAction SilentlyContinue | Select-Object Source
gh --version
gh auth status -h github.com
~~~

Do not publish authentication details in issue comments. Session UUID must be identified from the supported Codex UI/command-center (`codex agents` or session inspector), *not* guessed or scraped from private session databases. If CLI or queue is missing, record UNAVAILABLE and stop. Do not automatically install binaries or start background daemons.

**Explicit opt-in probe after checks:** choose the existing execution-session UUID, then run a one-line `codex queue --thread <UUID> --message <PROBE TEXT>` with a harmless instruction that explicitly prohibits file edits, Git operations and starting 007/008. Observe the **same Desktop thread** displaying the new message and its reply; compare the unique probe ID. Record whether it was immediate, delayed, queued, or unavailable. If it is not visible, do not classify as success.

Probe condition must prove: target UUID exact; queue reports no fatal errors; original Desktop thread receives the probe; reply contains unique code; working tree unchanged; GitHub Issue gets actual evidence. Only after this result can inbox/listener execution be approved.

## 5. Prerequisite enforcement

- Module 007: design approved; implementation may be separately authorized, but do not claim it has started unless there is actual evidence.
- Module 008: design approved, **implementation blocked until 007 has independent QA ACCEPTED and accepted implementation SHA**.
- Status on GitHub is informational; listener must independently verify actual QA report and approved commit, never trust an Issue author/label alone.
- A notification for 008 may say "design ready / blocked"; it must never say "start implementing 008" while the gate is closed.
- No merging to `main` by listener; no `--yolo`, no `reset --hard`, no force-push, no script from Issue, no silent automatic deployments.

## 6. Proposed rollout / acceptance

**Phase B0 — capability probe (now):** Read-only Windows checks + harmless queued message to existing thread, user-initiated once; NO listener code.
**Phase B1 — inbox pilot (after B0 PASS and user approval):** implement least-privilege local listener in a separate reviewed script/tool; initially DRY_RUN, only logs eligible issues; no delivery.
**Phase B2 — delivery smoke (after B1 QA):** enable probe/notify delivery to pinned UUID, verify visible ACK + GitHub comment + no duplicate on reload/retry.
**Phase B3 — gated production (separate approval):** Design Window creates approved dispatch Issue and Windows listener queues message after verifying genuine QA gate; implementation still uses existing Codex safeguards and PR/QA process.

Acceptance:
1. Private inbox only readable to authorized account and listener.
2. GitHub auth/Windows Codex version/session UUID explicitly validated.
3. Existing Desktop conversation actually shows probe, not merely CLI exit code.
4. Probe causes no source edits, Git commits or 007/008 starts.
5. Invalid user/issue/label/sha/gate rejected.
6. Duplicate polling and offline restart do not requeue ACKed jobs.
7. No network listener/secrets in repo/logs.
8. Queue/unloaded/locked/busy behavior is reported truthfully.
9. Operator can disable listener and cancel pending deliveries immediately.
10. Independent QA can trace task ID → Issue → exact handoff SHA → received thread ACK.
11. No Module 008 implementation until 007 QA ACCEPTED.
12. Only after Design Window approval may B1/B2/B3 execute.

## 7. 3 OSS projects inspected — reference only (2026-11-21)

| Project | GitHub Stars snapshot | Latest observed commit | License | Technology / deployment | Reuse / change cost / risk |
| --- | --- | --- | --- | --- | --- |
| openai/codex — https://github.com/openai/codex | ~135.9k | 2026-11-21 | Apache-2.0 | Rust / official Codex CLI; Low to use queue, High to alter server | **Reuse official `codex queue` executable**; do not fork Codex. Windows session daemon/queue semantics require test. |
| cli/cli — https://github.com/cli/cli | ~47.1k | 2026-11-20 | MIT | Go / prebuilt `gh` CLI; Low | **Reuse official `gh api`** for issues/labels/receipts. No separate GitHub client library; careful auth scopes and API rate limits. |
| songyb111-gachon/codex-auto-resume-windows — https://github.com/songyb111-gachon/codex-auto-resume-windows | Stars not reliably verified | 2026-11-17 | MIT | Windows/Python; Medium–High | Reference Windows existing-session detection/recovery concepts only. Its purpose is quota auto-resume, not GitHub dispatch; third-party code and version coupling imply high integration risk. Do not install it as part of B0. |

License and activity were verified against GitHub; Star counts are approximate and should be refreshed if full implementation is authorized. Re-evaluate all three before coding per user's GitHub-first rule.

## 8. Required next evidence

The Windows execution window should return:
- Codex CLI source/version and whether `codex queue --help` exposes `--thread`, `--message`, `--resume`.
- Existing target session UUID/short fingerprint **privately**; do not publish full session IDs in GitHub if avoidable.
- Whether `codex doctor` reports daemon/port/ownership errors (redacted).
- Whether harmless probe entered the exact original window and replied with a matching nonce.
- `git status --short` before/after, and proof no implementation initiated.
- No listener, service, auto-start or Module 008 execution started by this diagnostic.

**This is a design proposal, not an implementation instruction. The design branch and draft PR may be reviewed; do not merge or enable listener without explicit Design Window acceptance.**
