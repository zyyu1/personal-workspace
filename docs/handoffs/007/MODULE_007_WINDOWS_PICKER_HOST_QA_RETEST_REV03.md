# Personal Workspace — Module 007 Windows Host QA Retest Revision 03

**DESIGN WINDOW DECISION (2026-11-21): AUTHORIZED — ONE FINITE SUPERVISED RETEST ONLY.**
**Issue:** https://github.com/zyyu1/personal-workspace/issues/16
**Original first-host result:** [FAIL for Chrome refusal of %TEMP% fixture](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7066983711); independently [PARTIAL](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7066996820).
**Rev02 initial operator report:** [PARTIAL / browser not started](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067103548); independent [REJECTED root-cause statement](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067126158); [operator correction](https://github.com/zyyu1/personal-workspace/issues/16#issuecomment-7067132536).
**Merged accepted app:** [Module 007 PR #15](https://github.com/zyyu1/personal-workspace/pull/15), merge commit `cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08`, independently accepted source SHA `1c35753804e6b99f2dc620756e4a8dce70f7292c`.
**Host QA only; NO application source/feature change; NO Module 008 development.**

## 1. Correct Revision 02 error attribution

- The **exact stored** double-backslash regular expression in Revision 02 was valid Windows PowerShell 5.1 and PowerShell 7 syntax. The initial operator claim that the formal regex itself failed was incorrect. Independent QA correctly rejected that attribution.
- The original execution window transmitted PowerShell code via a **JavaScript template string**, which consumed one escape level before commands arrived in an **interactive PowerShell** process. The received form had a single backslash at `Temp` and triggered `Unrecognized escape sequence`.
- Other queued interactive statements ran after the failed location preflight, creating an otherwise harmless three-file QA fixture in Documents. The operator stopped Vite/browser and revised their report. No real native-picker attempt was used in Revision 02, and no code error in Module 007 was demonstrated.
- This is a **command transport / non-atomic execution failure**. Do not "fix" Revision 02's historical valid expression or overwrite the rejected report. Continue with a new, mechanically different execution mode.
- **Final acceptance matrix is unchanged: 23 PASS / 0 FAIL / 1 PARTIAL**. Item #4 real Windows folder grant/preview/index/reload remains PARTIAL; Issue #16 must remain OPEN.

## 2. Exact executable helper — run a repository file, NOT an embedded command

The Design Window has published this **non-application QA script file** on `main`:

[`docs/handoffs/007/MODULE_007_WINDOWS_HOST_QA_FIXTURE_REV03.ps1`](https://github.com/zyyu1/personal-workspace/blob/main/docs/handoffs/007/MODULE_007_WINDOWS_HOST_QA_FIXTURE_REV03.ps1)

**All logic is in the actual checked-out `.ps1` bytes**. The script uses no regular-expression matching and no embedded Windows backslash path literal for file creation; it compares canonical Windows Documents path, rejects redirected/reparse/cloud/sensitive paths, then creates exactly one new `Documents/PWS-M007-HostQA-<unique>` child and three harmless files. A failure before creation cannot fall through to queued create statements because it is **one script invocation**, not multiple interactive commands. It does **not** remove existing fixtures.

**Transport rule (mandatory):** the original execution/Computer Use window must **not** transmit multiline PowerShell source via JavaScript template strings, JSON string interpolation, `Invoke-Expression`, `-EncodedCommand`, `powershell -Command "..." `, or line-by-line interactive typing. It must run the checked-out file by pathname in one native PowerShell invocation. Do **not** use the old Revision 02 embedded snippet for this test.

**Read-only preflight in the checked-out repo, Windows PowerShell 5.1/7 (interactive session):**

```powershell
git branch --show-current
git status --short
git rev-parse HEAD
git merge-base --is-ancestor cd2c7145b2a27a7b7e2815b9ad4eea53a6416b08 HEAD
```

Require `main`, empty `git status --short`, and merge-base exit code `0`. If not, STOP; do not reset/rebase/force pull. The new `.ps1` file must be present in this checked-out main. If it is **not present**, STOP and report the checkout's SHA. Do **not** recreate it by typing/pasting source or auto-update the repo; request a separate authorized safe fast-forward/sync procedure if needed.

**Operator runs exactly ONE command, from the repo root, in an ordinary, non-admin PowerShell window:**

```powershell
$qa = & ./docs/handoffs/007/MODULE_007_WINDOWS_HOST_QA_FIXTURE_REV03.ps1
```

The path uses **forward slashes**, and no regex or Windows backslash literal is embedded in the invocation. The operator / execution window must send only this **single-line literal command**, not reserialize the script through a JavaScript template string. Keep the same PowerShell session to retain `$qa` with its private root, paths and SHA256 hashes.

**Important atomic gate:** This command is its **own separate operator step**. **NO app-start or folder-picker commands may be pre-queued**. First verify that the command completed without a terminating error, a single valid object was returned, `$qa.Created -eq $true`, there are exactly three distinct expected files and corresponding SHA256 entries, and the child directory is new and safe. If anything fails or the script is blocked by PowerShell's normal execution policy, **STOP**. Do **not** use `Set-ExecutionPolicy`, `-ExecutionPolicy Bypass`, elevated PowerShell, `Unblock-File`, a direct paste fallback or a differently located fixture. Do not reuse the already-created Rev02 Documents fixture.

The app may start only after the user explicitly sees **PASS: fixture preflight**. Browser permission requires separate conscious human interaction.

### Post-test integrity (only after a successful fixture and any browser run)

With the **same** PowerShell session and `$qa` object:

```powershell
$changed = @()
foreach ($rel in $qa.Files) {
    $file = Join-Path $qa.Root $rel
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        $changed += "$rel missing"
    } elseif ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $qa.Hashes[$rel]) {
        $changed += "$rel changed"
    }
}
if ($changed.Count) { throw ("FAIL: QA fixture changed: " + ($changed -join ', ')) }
Write-Host 'PASS: all three fixture files unchanged'
```

If the execution channel cannot preserve the same PowerShell session between fixture and hash verification, STOP and report `NOT VERIFIED`; do not invent a baseline hash.

## 3. One narrowly scoped real browser authorization attempt

Only after the script's preflight passes:

1. Use the existing installed dependencies (no `npm install`), and start one **temporary foreground** Vite server:
   ```powershell
   npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
   ```
   Keep it foreground only while the operator observes the browser; stop with Ctrl+C afterward. No background process/scheduler/auto watcher; no `0.0.0.0` binding or public tunnel.
2. Open `http://127.0.0.1:5173/study/courses` in one fresh Chrome Incognito / Edge InPrivate window at normal security settings. Use the real app to navigate to an existing demo or new disposable CourseOffering Materials page.
3. **Human operator** manually clicks `Add / refresh materials` → `Link extracted folder`, then chooses only the **new script-created `$qa.Root` child directory**, never its `Documents` parent or the pre-existing Rev02 fixture. User personally decides and grants the normal Chrome directory prompt. No mock, DevTools picker call, automated approval, browser security bypass or alternate path.
4. If Chrome rejects this new Documents child, or the host asks for privilege escalation, **STOP after this one attempt**. Record exact sanitized error and mark grant/preview/confirm/persistence downstream **NOT VERIFIED**. Do not retry with another directory, browser setting, account, or real course materials.
5. If normal Chrome authorization succeeds: check only the bounded **relative-path manifest** for `Lectures/Intro.md`, `Exercises/Task01.txt`, `Notes/Readme.txt` (3 accepted files), no personal files. Before clicking `Confirm index only`, verify merely previewing did not create an import. Then user explicitly clicks `Confirm index only`.
6. Check CourseOffering-owned entries and canonical Global Resources, Inspector navigation and accurate source permission/byte-availability labels. Reload **the same private session and same origin**, verify IndexedDB index and links persist but do **not** claim permanent directory read grant or automatically available file bytes. No automatic scan.
7. Run the post-test SHA256 block in the same PowerShell session (above); verify original 3 files unchanged. Stop foreground Vite with Ctrl+C, check local port no longer listened, and `git status --short` still clean. Leave only harmless fixture(s), no scripted deletion.

No ZIP extraction, any source file edit, privileged scan, external program execution, Local Connector/Managed Storage installation, repository code change, B2B/B3, Codex queue or Module 008 is authorized.

## 4. Evidence, QA and final decision

The Windows operator posts one **sanitized** Revision 03 report to [Issue #16](https://github.com/zyyu1/personal-workspace/issues/16) with:

```text
Module 007 Windows Host QA — Revision 03
1. Code anchor ancestor, current HEAD / branch, clean git:
2. Exact checked-out .ps1 SHA/commit and single-line native invocation:
3. Transport: checked-out .ps1; no JS template or interactive multi-statement queue:
4. Rev03 fixture preflight: PASS / FAIL; new Docs child; 3 benign files:
5. Windows/Chrome or Edge versions, native browser and in-app click:
6. Picker opened: PASS / FAIL / NOT VERIFIED:
7. Genuine user grant: PASS / FAIL / NOT VERIFIED:
8. Preview 3 accepted paths: PASS / FAIL / NOT VERIFIED:
9. User Confirm index only: PASS / FAIL / NOT VERIFIED:
10. Canonical CourseOffering Source/Entry/Resource & Inspector: PASS / FAIL / NOT VERIFIED:
11. IndexedDB same-session reload: PASS / FAIL / NOT VERIFIED:
12. Original 3 files SHA256 unchanged: PASS / FAIL / NOT VERIFIED:
13. Cancel, deny, expiry/unsupported (mark each independently):
14. Foreground Vite stopped, port no listener, git clean:
15. Operator disposition: PASS / PARTIAL / FAIL; exact reason for every non-PASS:
16. Sanitized screenshot/error evidence only (no username, local full path, tokens, passwords or private study data):
```

A completely independent **Review Only QA window** must inspect the real-host operator evidence and post a new decision. The reviewer must verify the actual invocation method (not just claim PowerShell `PASS`), preserve both previous QA histories and confirm no code/source modifications.

**Only after an observed real user-granted picker → safe preview → explicit index-only confirmation → canonical persistence/inspector → same-session reload → unchanged SHA256** may the Design Window consider moving matrix #4 from PARTIAL to PASS and closing Issue #16. A 007 positive test does not **automatically** start Module 008.

## 5. Downstream gate remains unchanged

- **Module 007 code remains MERGED / independently CODE ACCEPTED.** Host acceptance #4 is **PARTIAL / PENDING** until separate independent evidence. Old QA reports remain historical and are not rewritten to PASS.
- **Module 008 stays NOT STARTED.** The user wants 007 host QA final disposition first; actual merged 007 domain interfaces still need checking and a **new explicit 008 code-start authorization** after this QA loop.
- B2B remains paused/on-demand only; B3, real Codex Queue, background Windows listeners/schedulers and automatic implementation remain not authorized.

**One-shot instruction ends when the operator posts the sanitized report and stops the local host.**
