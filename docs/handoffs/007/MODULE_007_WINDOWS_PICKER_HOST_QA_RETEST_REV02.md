# Personal Workspace — Module 007 Windows Folder Picker Host QA Retest Revision 02

**Status:** DESIGN WINDOW AUTHORIZED — ONE SUPERVISED, FINITE RE-TEST ONLY (2026-11-21). **NO CODE CHANGE, NO MODULE 008 START.**
**Tracking:** [Issue #16](https://github.com/zyyu1/personal-workspace/issues/16).
**Original operator outcome:** [Host QA FAIL at %TEMP% fixture](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7066983711).
**Independent QA outcome:** [PARTIAL](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7066996820).
**Code baseline:** PR #15 merged as `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`; independently accepted implementation code anchor `1c35753804e6b99f2dc620756e4a8dce70f7292c`.
**Authority:** Direct user request to complete Module 007 before Module 008, and subsequent request to continue the independent host-QA disposition.
**Supersedes for retest fixture location only:** prior [Windows Host QA instruction V1.0](./MODULE_007_WINDOWS_PICKER_HOST_QA_INSTRUCTION.md). All its no-code, source-safety, honest-evidence and stop-on-failure rules remain in force.

## 1. Decision / incident classification

On Windows 10 Pro build 19045 / Chrome 157.0.8103.79 Incognito, an actual in-app `Link extracted folder` click opened the native Windows folder picker. Chrome then refused the **instruction-mandated `%TEMP%` child directory**, describing system files; the operator cancelled and stopped, preserving all three fixture file hashes and clean Git. **That is a real host-positive-path FAIL with downstream results NOT VERIFIED**, not evidence that Module 007's JavaScript import path has failed. Independent Review Only correctly retained **Module 007 matrix #4 = PARTIAL / HOST VERIFICATION PENDING**.

This Revision 02 changes **only the disposable fixture location and grants one user-observed repeat of the same finite host QA.** It does not weaken browser security or authorize a workaround if Chrome objects again.

## 2. Exact allowed new location and security stop

**Only permitted new positive-test directory:** a freshly created, uniquely named **child** of the current interactive user's ordinary, local, non-synced Windows `Documents` directory:

```text
%USERPROFILE%\Documents\PWS-M007-HostQA-<unique-id>\
    Lectures\Intro.md
    Exercises\Task01.txt
    Notes\Readme.txt
```

Select the uniquely named **`PWS-M007-HostQA-...` child**, **not the Documents parent**. No files other than the three harmless fixtures are permitted in the new child. Do not use `%TEMP%`, `%APPDATA%`, `C:\`, the profile root, Desktop, Downloads, a shared folder, real course folder, source repository, privileged/sensitive/managed directory, system or program directory.

**Fail-closed folder checks:** If `%USERPROFILE%\Documents` is absent, a reparse point/junction/symlink, redirected to a cloud sync directory (OneDrive/Dropbox/SharePoint/etc.), unexpectedly protected or otherwise unsuitable, **STOP without creating or selecting a substitute path**; report `PARTIAL / LOCATION_UNAVAILABLE` to Design Window. Do not silently create Documents or browse a different real directory. Do not choose an existing folder as a fallback. No elevated shell; no ACL relaxation, permission changes, unsafe Chromium flags or DevTools API invocation.

The operator must personally observe the Windows folder dialog and Chrome's permission request and either consent to **this new disposable child folder only**, or cancel. If the browser again rejects it, **STOP after one attempt**. No second fallback site, path, browser policy bypass or alternative user-data selection is authorized.

## 3. Windows PowerShell — create a NEW disposable fixture

Use **ordinary PowerShell** as the same interactive user, never Administrator. Run once; preserve `$qaRoot`, `$qaFiles`, `$beforeHashes` in that process. The script checks the approved parent before any writes; creates only one new unique child and three benign files, no deletions and no repository modifications.

```powershell
$ErrorActionPreference = 'Stop'
$parent = Join-Path $env:USERPROFILE 'Documents'
if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
    throw "STOP: the approved local Documents folder does not exist; no fallback authorized"
}
$parentInfo = Get-Item -LiteralPath $parent -Force
if (($parentInfo.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw "STOP: Documents is a link/junction/reparse point"
}
if ($parentInfo.FullName -match '(?i)(OneDrive|Dropbox|SharePoint|AppData|\\Temp\\)') {
    throw "STOP: Documents is a cloud/sensitive/temporary location"
}
$qaRoot = Join-Path $parentInfo.FullName ('PWS-M007-HostQA-' + [guid]::NewGuid().ToString('N').Substring(0,12))
if (Test-Path -LiteralPath $qaRoot) { throw "STOP: QA path already exists" }
New-Item -ItemType Directory -Path $qaRoot -ErrorAction Stop | Out-Null
foreach ($name in @('Lectures','Exercises','Notes')) {
    New-Item -ItemType Directory -Path (Join-Path $qaRoot $name) -ErrorAction Stop | Out-Null
}
Set-Content -LiteralPath (Join-Path $qaRoot 'Lectures\Intro.md') -Value '# Harmless fixture' -Encoding UTF8
Set-Content -LiteralPath (Join-Path $qaRoot 'Exercises\Task01.txt') -Value 'Fixture exercise 01' -Encoding UTF8
Set-Content -LiteralPath (Join-Path $qaRoot 'Notes\Readme.txt') -Value 'Read-only indexing test' -Encoding UTF8
$qaFiles = @('Lectures\Intro.md','Exercises\Task01.txt','Notes\Readme.txt')
$beforeHashes = @{}
foreach ($rel in $qaFiles) {
    $beforeHashes[$rel] = (Get-FileHash -LiteralPath (Join-Path $qaRoot $rel) -Algorithm SHA256).Hash
}
$all = @(Get-ChildItem -LiteralPath $qaRoot -File -Recurse)
if ($all.Count -ne 3) { throw "STOP: unexpected fixture file count" }
Write-Host 'Created exactly 3 harmless files in a NEW non-TEMP QA child folder.'
Write-Host 'Operator-only local path (DO NOT POST):' $qaRoot
```

If the script throws at any point, STOP and report; do not alter ACLs or move files by script to a new location.

## 4. Foreground app / real Windows browser positive flow

1. In your existing Personal Workspace checkout, perform read-only preflight: `git status --short`, `git branch --show-current`, `git rev-parse HEAD`; check that `git merge-base --is-ancestor cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08 HEAD` returns exit `0`. Existing user changes must not be touched. If repository is dirty, or merge anchor is absent, stop.
2. Use existing installed dependencies and run **temporary foreground**:
   ```powershell
   npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
   ```
   No installation, build mutation, public binding, unattended startup or background watcher. Stop with Ctrl+C at end. If dependencies missing, stop rather than installing or editing the lockfile.
3. Open `http://127.0.0.1:5173/study/courses` in a **fresh Incognito Chrome or InPrivate Edge** session with normal browser settings. Keep this same window and origin for the reload. In DevTools, if safe to do so, record **read-only**:
   ```javascript
   ({ secureContext: isSecureContext, pickerAvailable: typeof window.showDirectoryPicker === 'function', origin: location.origin })
   ```
   If opening DevTools is unavailable, mark these as NOT VERIFIED; actual picker UI behavior is more important. **Do not call** the picker from the Console.
4. Navigate via UI to the existing demo CourseOffering `Materials` (or a newly created disposable QA Offering). User clicks `Add / refresh materials` then `Link extracted folder`. Select **only** the new `PWS-M007-HostQA-...` child folder. If Chrome displays a normal folder-access permission prompt, the **user decides** whether to grant this folder. No automation of the OS picker or bypass. If the picker rejects the folder as sensitive/system-protected, record exact sanitized error, cancel and STOP.
5. If and only if access succeeds, verify manifest preview contains `Lectures/Intro.md`, `Exercises/Task01.txt`, `Notes/Readme.txt` with correct relative paths/classifications and the expected 3 safe files. **Before confirm:** verify this is only a preview and there has been no import. Then manually click `Confirm index only`.
6. Verify the 3 linked canonical Study Resource entries, ownership by the selected CourseOffering, Material Inspector navigation, honest `Index only`/bytes unavailable semantics. Reload the **same Incognito window**, verify persisted index/Resource links in that session; do not assert permanent directory permission or file-byte availability. No automatic rescan.
7. Return to the same PowerShell session and compare fixture hashes:
   ```powershell
   $changed = @()
   foreach ($rel in $qaFiles) {
       $file = Join-Path $qaRoot $rel
       if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { $changed += "$rel missing"; continue }
       if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $beforeHashes[$rel]) {
           $changed += "$rel changed"
       }
   }
   if ($changed.Count) { Write-Warning "FAIL: $($changed -join ', ')" }
   else { Write-Host 'PASS: all 3 disposable fixture files unchanged.' }
   ```
8. Optional and **only if safe**: cancel another picker attempt without selection and confirm previous index is unchanged; unsupported/denial/permission expiry may be marked NOT VERIFIED. Do not modify OS policies or permissions to force negative states. The first authorized successful picker+grant+index+reload is required for a positive matrix #4 result.
9. Stop the foreground Vite process with Ctrl+C. Verify Git remains clean and note that port 5173 is stopped. Leave the fixture available for optional later inspection; **do not run automatic delete scripts**. No source change, no PR, no Module 008.

## 5. Evidence, independent QA, and acceptance gate

Append **one sanitized operator Host QA Revision 02 report** to [Issue #16](https://github.com/zyyu1/personal-workspace/issues/16). Include:

```text
Module 007 Windows Host QA — Retest Revision 02
- Existing code anchor / merge ancestor checked:
- Repository clean before/after:
- OS/browser versions, true Incognito/InPrivate:
- Browser origin; isSecureContext and picker availability (or NOT VERIFIED):
- Approved NEW Documents child fixture (do not post local full path):
- Exactly three disposable files pre/post:
- App's real user click opened Windows picker: PASS / FAIL
- Chrome granted access to THIS child folder: PASS / FAIL
- Sanitized native error (if failed, no retries):
- Preview and 3 relative paths: PASS / FAIL / NOT VERIFIED
- Confirm index only: PASS / FAIL / NOT VERIFIED
- Canonical Study CourseOffering Resource/Entry/Inspector: PASS / FAIL / NOT VERIFIED
- Same-session IndexedDB refresh persistence: PASS / FAIL / NOT VERIFIED
- SHA256 3/3 unchanged: PASS / FAIL / NOT VERIFIED
- Cancellation/denial/expiry/unsupported states (each separately):
- No extraction, writes to source, auto-rescan, background agent, B2B/B3/Queue/008:
- Foreground Vite stopped; git clean:
- Operator result: PASS / PARTIAL / FAIL
- Evidence attachments: sanitized crop (optional; NO username/full paths/private data)
```

The prior `%TEMP%` FAIL and corresponding independent PARTIAL review remain immutable historical evidence. Ask an **independent Review Only QA window** to review the real-host result. No source edits and no fabricated successful grant.

**Only after** independent host QA confirms a real positive directory access → preview → explicit index-only confirm → canonical persistence/reload → unchanged sources may the Design Window consider marking Module 007 matrix #4 **PASS** and closing Issue #16. If any stage is missing or forbidden by Chrome, leave #4 **PARTIAL / HOST VERIFICATION PENDING** with explicit reason and seek a new Design Window disposition before further attempts.

## 6. Non-negotiable stop / downstream boundary

- This authorizes **one user-observed host retest** and temporary foreground local server, not endless retries or alternate directory hunting.
- Never lower Chrome security, elevate, use console picker calls, fake handles, privileged folders, actual personal course material, a new Local Connector, managed storage, source-code modifications, `git pull` that overwrites work, git reset/force push, new development PR, real `codex queue`, B2B/B3, Windows scheduler, service, resident process or background listener.
- **Module 008 remains NOT STARTED / BLOCKED by the user-specified Module 007 completion gate.** Even if host QA passes, Module 008 requires a **new separate Design Window authorization** after reviewing the final Issue #16 evidence and actual merged Module 007 interfaces.

**Expected end state:** a bounded, documented real-Windows picker acceptance attempt on a new non-TEMP, non-sensitive child directory; original repo untouched; independent QA requested; Module 008 not started.
