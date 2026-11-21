# Module 007 QA Handoff

## Candidate

- Branch: `codex/module-007`
- Base: `febcc3429af0938b010e184d6b851fb226b59678` (`origin/main` at implementation start)
- Scope: Study Course Overview V1.0 only
- Frozen inputs: `DESIGN_APPROVED.md`, `EXECUTION_INSTRUCTION.md`
- OSS review: `OSS_REUSE_REVIEW.md`
- QA mode: Review Only; do not modify the candidate

The final candidate commit and PR URL are added to the GitHub PR description after push.

## Architecture and reuse

```text
Course 1 ── * CourseOffering
                 ├── Study repository: Source / Import / Entry / Progress / Assessment
                 ├── canonical Resource ── ResourceLink(course-offering)
                 ├── canonical Task(area=study, projectId=offeringId)
                 ├── canonical TimeEntry(projectId=offeringId)
                 ├── verified Assessment ── Global Calendar query projection
                 └── WorkspaceResumeContext(area=study)
```

The versioned `study-courses` repository uses the A01 persistence adapter and seed/version behavior. Global Resource, Task, Calendar, TimeEntry, Timer and Resume services remain authoritative. No Study-specific copies of these entities were introduced.

## Implemented surfaces

- `/study/courses`
- `/study/courses/:courseOfferingId/overview`
- `/study/courses/:courseOfferingId/materials`
- Course and semester Offering identity separation
- Overview cards backed by canonical queries and honest unknown states
- folder-handle manifest preview and ZIP manifest preview, both user initiated
- preview-before-confirm, index-only persistence, manual classification, rescan identity
- existing canonical Resource linking without copying the Resource
- shared `InspectorShell`, canonical study task, timer context and resume context
- verified-only Study assessment projection into Global Calendar
- explicit future state for Tasks, Exercises, Exams, Labs and Notes tabs

## Security and availability model

- ZIP source: 250 MB; 5,000 entries; 2 GB declared expanded total; 250 MB per entry; compression ratio 200; depth 30.
- rejects traversal, absolute/drive/UNC/backslash paths, encrypted entries, symlinks/special files, unsupported compression methods and undecodable replacement characters.
- entries are never extracted, executed or uploaded.
- indexed metadata and current-device byte availability are separate. ZIP/folder resources become `permission-required` after persistence.
- external opening is allowed only through `GlobalResourceService.openOriginal`, which revalidates HTTP/HTTPS.
- Managed Import and cross-device file availability remain disabled.

## Test evidence

Commands run on Windows:

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS with 12 pre-existing warnings in modules 001–006; 0 errors, 0 Module 007 warnings |
| `npm run build` | PASS; CourseLibrary 3.72 kB, Study service 8.38 kB, CourseWorkspace 153.38 kB (uncompressed chunks) |
| `npm test -- --run` | PASS, 10 files / 126 tests |
| `git diff --check` | PASS (Git line-ending notices only) |

Module tests: `src/features/study/Study.test.tsx` (22 tests). They cover Memory Adapter identities, idempotent rescan, manual classification, Resource linking/unlinking, Global Task identity, verified-only Calendar projection, Study Time isolation, Resume, folder fixture, real in-memory ZIP parsing, traversal, symlink and compression-ratio fixtures, and UI truth states.

Interactive browser evidence:

- IndexedDB/browser reload: linked canonical `baseline-results.csv`, reloaded, and observed the same Resource entry.
- responsive observations had no document overflow at effective widths 1107, 787 and 412 pixels. At the mobile breakpoint, the import wizard and Inspector are fullscreen; Escape closed Inspector and retained the Materials route.
- exact 1440/1024/390 automated screenshot artifacts are not attached because standalone headless Edge captured the async loading frame. Independent QA should capture exact dimensions in its browser runner. This is not represented as E2E screenshot PASS.
- actual Windows directory permission was not granted during development; folder behavior is covered by a reproducible handle fixture and must not be described as Local Connector verification.

## Acceptance matrix

| # | Result | Evidence / limitation |
| ---: | --- | --- |
| 1 | PASS | Course/Offering service test and independent Offering state |
| 2 | PASS | Overview browser check and canonical service queries |
| 3 | PASS | `ECTS unknown`, `Date unknown`, no inferred progress |
| 4 | PARTIAL | bounded explicit-handle fixture passes; real Windows picker not granted in development |
| 5 | PASS | unsupported browser/permission/managed-storage states are explicit |
| 6 | PASS | real in-memory zip.js archive preview test |
| 7 | PASS | wizard requires preview and explicit Confirm; no write/extract operation exists |
| 8 | PASS | traversal variants, symlink and compression-ratio tests |
| 9 | PASS | relative path/source ID persisted; tree sorting preserves hierarchy |
| 10 | PASS | suggestion plus manual persistent override/rescan test |
| 11 | PASS | past-paper assessment regression test |
| 12 | PASS | Global Resource stable ID and existing-resource idempotency test |
| 13 | PASS | same-source double import does not duplicate Resource/Entry |
| 14 | PASS | missing entries retain IDs; progress/task links live on canonical Resource |
| 15 | PASS | metadata sync and byte availability are distinct fields and UI labels |
| 16 | PASS | Open Original disabled without verified provider availability |
| 17 | PASS | canonical Global Task ID/service test |
| 18 | PASS | separate repositories/queries; verified assessments only reach Calendar |
| 19 | PASS | Study Resume test; Continue never starts timer |
| 20 | PASS | no extraction or execution API in import path |
| 21 | PASS | unsafe/per-entry failures and partial/failed status retained |
| 22 | PARTIAL | responsive live checks passed at effective 1107/787/412; exact screenshot artifacts need independent QA |
| 23 | PASS | commands above |
| 24 | PASS | only Module 007; future tabs are inert and labeled FUTURE |

## Independent QA requests

1. Re-run all commands and inspect the candidate diff for scope.
2. Use a real browser IndexedDB profile, reload after create/import/task/progress operations, and verify IDs persist.
3. Capture exact 1440, 1024 and 390 screenshots and inspect horizontal overflow/focus behavior.
4. With a disposable fixture directory, invoke the real browser directory picker and confirm only the chosen tree is indexed. Do not treat it as Local Connector or persistent byte access.
5. Re-run malicious ZIP fixtures including traversal, drive/UNC, symlink, encrypted, high-ratio and limit failures.
6. Confirm modules 001–006, Global Tasks, Calendar, Timer, Resources and Resume remain functional.
7. Return `ACCEPTED / ACCEPTED WITH FIXES / REJECTED / INSUFFICIENT EVIDENCE`, with severity, file/line evidence and minimal fixes.

## Known limitations

- no Local Connector, Managed Storage, LMS connector, cloud sync or persistent browser file handle.
- no extraction, PDF content search, OCR or automatic classification beyond filename/path suggestions.
- directory enumeration and ZIP central-directory parsing currently run on the UI thread; configured bounds reduce exposure, but worker offloading is a future performance enhancement.
- cross-repository ResourceLink + Study Entry writes are recoverable/idempotent but not one atomic transaction, matching the documented A01 adapter limitation.
