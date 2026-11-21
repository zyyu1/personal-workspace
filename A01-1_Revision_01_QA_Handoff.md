# A01-1 Revision 01 — Independent QA Handoff

## Review mandate

Independently review only fixes A01-1-R01 through A01-1-R07. Do not treat the execution window's passing self-tests as acceptance. Return exactly one decision: `ACCEPTED`, `ACCEPTED WITH FIXES`, `REJECTED`, or `INSUFFICIENT EVIDENCE`.

## Repository baseline

- Repository: `C:\Users\yexun\Documents\Codex\2026-11-21\new-chat\personal-workspace`
- Branch: `main`
- Base HEAD: `8674dad1f067590b1f7ae030e3f7e9ec7fb40f1a`
- Delivery form: uncommitted Working Tree continuing the existing A01-1 work
- Scope guard: no A01-2, A01-3, Module 007, Study Workspace, Global Calendar, InspectorShell refactor, or backend introduction

Before testing, record `git status --short`, `git diff --check`, and the complete diff including untracked `src/data/persistence/*` and `src/services/safeExternalUrl.ts`.

## Claimed fixes to verify

1. **R01:** Seed, migration write-back, replacement, mutation, and reset update Repository Cache only after the adapter write commits. Failed seed/migration/reset leaves the last committed or uninitialized state authoritative.
2. **R02:** `ResearchProjectService` contains immutable project metadata only; Literature, Stage, Milestone, Task, and TimeEntry values are assembled from canonical services for every Research route. The `canonicalOverview` branch was removed.
3. **R03:** external URL writes use parsed HTTP/HTTPS validation where writes exist, and every current clickable external rendering path revalidates through `safeExternalUrl`. Unsafe historical values remain stored as data but are rendered unavailable and non-clickable.
4. **R04:** Submission Target lookup and creation occur inside one serialized repository mutation and deduplicate by `(projectId, outputId, opportunityId)` without replacing an existing Target.
5. **R05:** `RepositoryOperationError` and `MutationFailure` classify `validation-failed`, `not-found`, `migration-failed`, `persistence-unavailable`, and `unknown` without message regex. Only persistence-unavailable is retryable by default.
6. **R06:** backup metadata identifies `schema-migration` versus `seed-merge`; the first backup captures the original envelope and the second captures the schema-migrated intermediate envelope. IndexedDB backup and final write remain separate transactions and this limitation is disclosed.
7. **R07:** local-only persistence, multi-tab invalidation, cross-repository atomicity, export/restore, server backup/conflict resolution, and adapter-cache invalidation limitations are documented.

## Required independent commands

```powershell
cd C:\Users\yexun\Documents\Codex\2026-11-21\new-chat\personal-workspace
git status --short
git diff --check
npm run typecheck
npm run build
npm test -- --run
```

There is no configured lint script. Report lint as `NOT CONFIGURED`, not PASS.

## Focused acceptance checks

- Seed write failure does not create a readable Cache-only seed; a retry performs a second durable write.
- Migration write-back failure does not expose migrated Cache state and leaves the stored original envelope authoritative.
- Reset failure keeps the last committed state.
- IndexedDB write resolution occurs on transaction `oncomplete`, not request `onsuccess` alone.
- Combined Schema Migration + Seed Merge produces two correctly staged backups with correct source versions/data.
- Explicit validation/not-found/migration/persistence errors map to the correct code and retryability; generic text is not regex-classified.
- Updating stage `s2`, traversing Overview/Literature/Tasks/Experiments/Files/Timeline/Submissions, and returning does not reveal a stale static stage snapshot.
- Two concurrent identical `addTarget` calls return the same Target ID and persist one business record while preserving existing fields.
- Historical `javascript:`, `data:`, and `file:` values never produce clickable anchors; valid HTTP/HTTPS still do.
- Paper PDF capability still comes from `GlobalResourceService`, keeping metadata sync separate from device byte availability.
- Existing module 001–006 tests remain green.

## Execution-window evidence (re-run independently)

- TypeScript: PASS (`npm run typecheck`)
- Production build: PASS (`npm run build`), with the pre-existing/non-blocking bundle-size warning above 500 kB
- Tests: PASS, 7 files / 82 tests
- `git diff --check`: PASS; Git emitted Windows LF→CRLF informational warnings only
- Automated persistence tests use `MemoryPersistenceAdapter` under jsdom.
- Real-browser IndexedDB failure injection / full E2E is **not configured** and must not be inferred from Memory Adapter results. The adapter implementation waits for transaction completion, but independent browser verification is requested where the QA environment permits.

## Required QA output

Report:

1. Decision (`ACCEPTED` / `ACCEPTED WITH FIXES` / `REJECTED` / `INSUFFICIENT EVIDENCE`).
2. R01–R07 result individually with evidence and file/line references.
3. Commands, exit codes, test counts, and any browser IndexedDB evidence.
4. Regression status for modules 001–006.
5. Remaining issues classified P0–P3.
6. Any issue that requires a design decision rather than an implementation correction.

Do not implement fixes in the QA window. Return findings to the execution window/design window.
