# Personal Workspace — Module 007 Real Windows Folder Picker Host QA Instruction V1.0

**Status: DESIGN WINDOW AUTHORIZED — SUPERVISED MODULE 007 HOST VERIFICATION ONLY (2026-11-21)**  
**Authority:** Direct user instruction: finish Module 007 before starting Module 008; provide an executable Windows execution-window handoff.  
**Host QA tracking issue:** https://github.com/zyyu1/personal-workspace/issues/16  
**Code implementation:** [PR #15](https://github.com/zyyu1/personal-workspace/pull/15) **MERGED / CODE ACCEPTED**; merge `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`; independent code QA source `1c35753804e6b99f2dc620756e4a8dce70f7292c`.  
**Previously accepted QA:** [23 PASS / 0 FAIL / 1 PARTIAL](https://github.com/zyyu1/personal-workspace/pull/15#issuecomment-7065966274); only matrix #4 (real Windows directory-picker permission) is unresolved.  
**Execution owner:** Existing interactive Windows development/host-testing window, user present for any OS/browser permission grant.  
**No implementation rights:** No editing source, no PR/branch, no commit, no automated Codex queue, no startup/background polling, no B2B/B3, no Module 008. Only local test fixture, local app run, manual UI host test and safe QA evidence.

## 1. Scope, preflight, and stop conditions

- Read this entire instruction, the merged Module 007 approved design and `docs/handoffs/007/STATUS.md`. Inspect `src/features/study/components/MaterialImportWizard.tsx`, `folderManifestService.ts` and the actual package scripts before testing. The real implementation uses `window.showDirectoryPicker` **only on a real user click** and a bounded **index-only** manifest.
- Confirm the original working tree has no uncommitted work at risk. Run read-only `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, and `git merge-base --is-ancestor cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08 HEAD` (exit 0 means the accepted merge is an ancestor). If not, **STOP and report**; do **not** reset, rebase, checkout over uncommitted changes, force pull, or silently edit user work.
- Work on the **same user's Windows desktop**, not CI, container, fake directory handle or browser simulator. Use a supported current stable **Microsoft Edge or Google Chrome** with the original standard security settings; use `http://localhost:5173` (localhost is treated as a trustworthy development origin by supporting Chromium browsers). Do **not** disable web security or bypass browser prompts.
- Prefer a fresh **InPrivate/Incognito browser window** to isolate QA IndexedDB and leave the normal user profile/records untouched. Keep the window open during refresh tests; persistence is not expected after private window closes. Avoid clicking any browser “Clear site data” button for the normal profile.
- Only user-owned **disposable temporary files** may be selected. Never grant access to a school/private/project root, `C:\`, user profile root, shared drive, credential folder, or real course library for this test. User must explicitly confirm the OS/browser folder selection. No privileged scanning.
- Keep screenshot/log evidence sanitized: no full `%USERPROFILE%` paths, username, workspace credentials, tokens, canonical Codex thread UUID, or private study materials. Avoid posting screenshot of native Explorer with unrelated filenames.
- Host test is **not** a routine to automate system dialogs or click outside authorized folders. If `showDirectoryPicker` is missing, unsupported, fails due to permissions, or the actual host is inaccessible, **record PARTIAL/NOT VERIFIED or FAIL with exact reason**; do not claim PASS or replace with a fake.
- No real ZIP tests are required for row #4 (ZIP safety was separately accepted). Do not extract ZIPs, install a Local Connector, implement persistent file handles, enable managed storage, or use unsupported privileged OS integration.

## 2. Safe, disposable test fixture (PowerShell, optional)

Run only in the interactive Windows PowerShell window from which the test host can reach its local files. This creates **new** files only under a unique `%TEMP%` QA directory, does **not** edit the Git repository or any existing file, and does **not** delete anything:

```powershell
$qaRoot = Join-Path $env:TEMP ("PWS-M007-FolderPicker-QA-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Path (Join-Path $qaRoot "Lectures") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $qaRoot "Exercises") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $qaRoot "Notes") -Force | Out-Null
Set-Content -LiteralPath (Join-Path $qaRoot "Lectures\Intro.md") -Value "# Benign course fixture" -Encoding UTF8
Set-Content -LiteralPath (Join-Path $qaRoot "Exercises\Task01.txt") -Value "Exercise 01: simple fixture" -Encoding UTF8
Set-Content -LiteralPath (Join-Path $qaRoot "Notes\Readme.txt") -Value "Index-only read test" -Encoding UTF8
$qaFiles = @("Lectures\Intro.md", "Exercises\Task01.txt", "Notes\Readme.txt")
$beforeHashes = @{}
foreach ($rel in $qaFiles) { $beforeHashes[$rel] = (Get-FileHash -LiteralPath (Join-Path $qaRoot $rel) -Algorithm SHA256).Hash }
Write-Host "Created a new disposable 3-file QA fixture. Select it manually in the browser picker."
Write-Host "Local-only fixture path (DO NOT POST TO GITHUB):" $qaRoot
```

The exact local path is **only for operator use**. Do not include it in GitHub comments. Keep the `$qaRoot`, `$qaFiles`, `$beforeHashes` variables in the same PowerShell session for after-test integrity checking.

## 3. App start (foreground, stop after QA)

Inside the correct checked-out repository root (not in the temporary fixture folder), confirm:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08 HEAD
if ($LASTEXITCODE -ne 0) { throw "STOP: repository checkout does not contain accepted Module 007 merge" }
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

- Use an already installed workspace dependency tree. If `npm run dev` cannot start because dependencies are absent, STOP and ask before installing/updating dependencies; do not silently change lockfiles or run destructive commands.
- The Vite server is an **explicit, temporary foreground QA process**, not a scheduled watcher/service. Keep it running only during manual browser verification. End it with **Ctrl+C** afterward. Do not use public bind addresses (`--host 0.0.0.0`), tunnels, `npm run preview` against an unknown build, or browser security workarounds.
- Open `http://localhost:5173/study/courses` in the isolated Edge/Chrome InPrivate window (127.0.0.1 also works for the development host; use the same origin for all interactions). In DevTools Console, non-destructively check:

```javascript
({ secureContext: window.isSecureContext, pickerAvailable: typeof window.showDirectoryPicker === "function", origin: location.origin })
```

This **detects availability**, it does not open or bypass the picker. Do **not** invoke `showDirectoryPicker()` from Console as a substitute for the real in-app click.

## 4. Positive test — exact genuine native Windows grant

1. In the isolated browser profile, select an existing **demo CourseOffering** or create a dedicated throwaway Offering. Navigate to `/study/courses/<actualOfferingId>/materials` through the real UI; do not fabricate an ID.
2. Click `Add / refresh materials` → `Link extracted folder`. This must be a **real human click** invoking the browser's actual folder picker in the original Windows account.
3. In the native picker choose **only** the disposable `PWS-M007-FolderPicker-QA-...` folder from §2; deliberately approve its folder access prompt (the operator must be present). Record if permission was granted, denied, cancelled, or the picker did not open. Never use `showDirectoryPicker` from Console or fake an API to claim host QA PASS.
4. Observe the **bounded directory preview** with expected nested relative paths `Lectures/Intro.md`, `Exercises/Task01.txt`, `Notes/Readme.txt`, plus any directory entries; ensure original full Windows paths and private contents are not displayed as imported file bytes. Check counts, classifications and the `Index only` confirmation.
5. Before pressing `Confirm index only`, verify the original file set and canonical Study Resource/index state have not been mutated by the preview. Then **explicitly** confirm. Expect a truthful indexed-resource count and source availability/permission state.
6. Verify the Course Materials page shows the three benign files with relative-path metadata, correct Offering ownership and canonical global Resource linking. Follow a course Resource Inspector action and verify it resolves. **Do not assume Open Original remains authorized after reload**; the UI may legitimately show `Permission Required` after a metadata-only snapshot.
7. Reload the same private browser window. Indexed Course Sources/Entries/Resource links should persist in IndexedDB in the current private session; a previously granted browser directory permission or bytes need **not** persist. Verify no automatic new directory scan, file extraction or file overwrite occurs.
8. Compare fixture file SHA256 values **before/after**, with same PowerShell variables:

```powershell
$changed = @()
foreach ($rel in $qaFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $qaRoot $rel))) { $changed += "$rel (missing)"; continue }
  if ((Get-FileHash -LiteralPath (Join-Path $qaRoot $rel) -Algorithm SHA256).Hash -ne $beforeHashes[$rel]) { $changed += "$rel (changed)" }
}
if ($changed.Count -ne 0) { Write-Warning "FAIL: fixture changed: $($changed -join ', ')" }
else { Write-Host "PASS: all 3 QA fixture files unchanged (SHA256)." }
```

Do not post full fixture path, file contents or sensitive logs. A completed positive test requires **real Windows picker + explicit grant + correct index-only preview + confirmation + IndexedDB reload + original files unchanged**.

## 5. Negative/permission/availability checks (manual, bounded)

On the same **disposable** folder and isolated browser session, exercise only what the host/browser safely supports:

- **Cancel picker** before granting access: report a truthful cancellation/abort/non-sending state; **previously indexed Resource/Entries must stay intact**. Do not clear the browser's real profile.
- **Permission denied** (only if browser exposes a safe Deny or settings UI): no unauthorized enumeration or new index write; error/permission-required message. Do not disable security controls or install extensions.
- **Source unavailable/session permission expired:** where safely reproducible, document that the existing index remains metadata-only, no silent unrestricted read and no fabricated permanent access. Avoid OS-level permission mutations and renaming real folders. If no safe reproducible technique, mark **NOT VERIFIED**, not PASS.
- **Browser unsupported**: if a second browser genuinely lacks `showDirectoryPicker`, capture the app's honest unsupported state. Do not install an obsolete browser or spoof `window.showDirectoryPicker` to manufacture a failure.
- **No automatic filesystem watching:** after import, normal app idle or refresh should not silently scan arbitrary folders or launch OS processes. No Open Original success without a supported, authorized source.

**Stop on failure:** native picker blocked unexpectedly, manifest includes outside-folder data, any original source file modified/deleted, unauthorized silent access, extra privileges, successful file execution, or misleading permanent-availability claim. Record `FAIL` and report to Design Window for a new scoped remediation decision. Do not fix application code in this host-test authorization.

## 6. Evidence and decision procedure

In [Issue #16](https://github.com/zyyu1/personal-workspace/issues/16), the operator/QA posts a **sanitized** report:

```text
Module 007 — Windows Folder Picker Host QA Report
- Checked-out git HEAD / main ancestor verified:
- PR #15 merge anchor: cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08
- Windows version (no username/device ID):
- Browser and version:
- Origin and isSecureContext:
- Native window.showDirectoryPicker available:
- Original application click opened OS picker: PASS / FAIL / NOT VERIFIED
- Folder access granted by human in Windows browser: PASS / FAIL / NOT VERIFIED
- Folder preview: expected 3 safe files + relative paths, counts:
- User Confirm index only: PASS / FAIL / NOT VERIFIED
- Canonical Study offering/resource link and IndexedDB same-window reload: PASS / FAIL / NOT VERIFIED
- Fixture contents unchanged by SHA256: PASS / FAIL / NOT VERIFIED
- Cancel/deny/permission expiration/unsupported states (state separately):
- No extraction, overwrite, unrelated filesystem read, managed-storage claim or background watcher:
- App/test host stopped and clean git status:
- Result: PASS / PARTIAL / FAIL (explain every non-PASS)
- Evidence attachments: sanitized screenshots/logs (never local absolute path or secrets)
```

A **separate independent Review Only QA** must inspect the real-host operator evidence, distinguish genuine user-granted folder-picker interaction from a fake/mock, and report `ACCEPTED / PARTIAL / REJECTED / INSUFFICIENT EVIDENCE` linked to Issue #16. **Only Design Window may then mark Module 007 matrix #4 as PASS, update status, and close Issue #16.** If genuine host access is unavailable, keep #4 PARTIAL and Issue #16 OPEN. Do not claim 24/24 PASS automatically.

## 7. Stop / next module gate

- Stop the temporary foreground Vite server with **Ctrl+C** and close the isolated QA browser session; keep the normal browser profile and actual personal files untouched. Leave the harmless QA fixture in the temporary directory for optional inspection; deletion requires a deliberate later operator choice (no automatic `Remove-Item`).
- Do not alter GitHub project source files, merge branches, reset outbox or session, publish new implementation notification, install a local shortcut, or run B2B/B3.
- **Module 008 remains NOT STARTED.** User explicitly wants the Module 007 host acceptance wrapped up first. Even if #4 is independently accepted, do not begin Module 008 until Design Window reviews Issue #16's evidence, closes Module 007 host gate, maps Module 007's actual merged interfaces to Module 008 and publishes a **separate scoped 008 development authorization**.

**End state for this instruction:** real, limited Windows host QA evidence in Issue #16; no application code changes or subsequent-module execution.