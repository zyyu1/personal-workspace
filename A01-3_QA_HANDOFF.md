# Personal Workspace — Integration Remediation A01-3 QA Handoff

## Review mode

Independent QA must review only and must not modify the implementation. The execution window has completed development and self-checks but does not declare acceptance.

## Git baseline

- Repository: `C:\Users\yexun\Documents\Codex\2026-11-21\new-chat\personal-workspace`
- Branch: `main`
- Accepted A01-1 commit: `685ee98454f49a5fb97d9434ec4fed2d73b689c6`
- Accepted A01-2 commit: `9b4e1ac3e216abe4c12271c81d751b47ea7c6b8d`
- A01-2 commit message: `feat: integrate global calendar timer and resume context`
- A01-3 remains in the Working Tree for independent diff review.

## Implementation scope

1. Shared `InspectorShell` now provides one header, close action, Escape handling, focus containment/restoration, scroll container, responsive panel/fullscreen behavior, and loading/error/empty states.
2. Overview, Paper, Task, Run, Resource, and Submission inspectors retain domain content and operations while using the shell.
3. `/tasks` reads and mutates `GlobalTaskService`; it does not own another Task repository.
4. Global Tasks supports search and Area, Project, Status, Priority, and Due Date filters, canonical status updates, project navigation, PlannedSession counts, Resource counts, and stable task deep links.
5. `--surface: #F1E9DD` is defined at the root warm-beige token layer.
6. Shared duration formatting preserves stored seconds and displays `0 min`, `<1 min`, and detailed seconds as specified.
7. ESLint flat configuration and `npm run lint` are available.
8. Literature, Experiments, Submissions, Resources, Calendar, Global Tasks, Venue Explorer, and Submission Inspector routes/surfaces are lazily loaded with a shared loading state.

## Changed and added files

- `package.json`
- `package-lock.json`
- `eslint.config.js`
- `src/App.tsx`
- `src/components/AppShell.tsx`
- `src/components/GlobalTasksPage.tsx`
- `src/components/Inspector.tsx`
- `src/components/InspectorShell.tsx`
- `src/components/TaskInspector.tsx`
- `src/features/research/components/TimeInvestment.tsx`
- `src/features/research/experiments/components/RunInspector.tsx`
- `src/features/research/literature/components/PaperInspector.tsx`
- `src/features/research/planning/components/ResearchTasks.tsx`
- `src/features/research/planning/components/ResearchTimeline.tsx`
- `src/features/research/planning/services/planningService.ts`
- `src/features/research/resources/components/ResourceInspector.tsx`
- `src/features/research/services/researchProjectService.ts`
- `src/features/research/submissions/components/SubmissionInspector.tsx`
- `src/features/research/types.ts`
- `src/integration/A01-3.test.tsx`
- `src/styles.css`
- `src/utils/timeDuration.ts`

## Self-check evidence

| Command / check | Execution result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS with 0 errors and 12 pre-existing warnings |
| `npm test -- --run` | PASS — 9 files, 104/104 tests |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| Browser console errors | 0 |

The remaining Lint warnings are an explicit historical list: unused imports/arguments in Experiments, Literature, Resources and Venue Explorer, plus pre-existing exhaustive-dependency warnings in Resource Center and Project Submissions. A01-3 code adds no Lint errors.

## Bundle evidence

- Before A01-3 main JavaScript: `574.95 kB` (`158.54 kB` gzip).
- After A01-3 main JavaScript: `360.58 kB` (`108.51 kB` gzip).
- Main bundle reduction: `214.37 kB`, approximately `37.3%`.
- Largest lazy chunks: Literature `70.57 kB`, Experiments `47.71 kB`, Resources `26.28 kB`, Submission Inspector `15.29 kB`, Project Submissions `11.21 kB`, Global Tasks `7.08 kB`, Calendar `6.76 kB`.
- The previous Vite 500 kB warning is no longer emitted.

## Browser evidence

Local Vite URL: `http://127.0.0.1:4173`

- 1440×900 `/tasks`: 5 canonical rows, 440 px Task Inspector, no horizontal overflow, stable `/tasks?task=t1` deep link.
- Escape closed the Task Inspector, returned to `/tasks`, and restored focus to the originating task control.
- 390×844 `/tasks`: desktop table hidden, 5 mobile cards, fullscreen 390×844 Inspector, no horizontal overflow.
- 390 px Literature deep link initially exposed an intrinsic card-width overflow; it was fixed with explicit grid-item minimum sizing and revalidated with document `scrollWidth === clientWidth`.
- 1024×768 Literature: 460 px overlay drawer, no horizontal overflow.
- Paper deep link loaded through the lazy route with the shared shell and no loading-state residue.

## Acceptance self-check

1. PASS — all six inspector domains use `InspectorShell`.
2. PASS — desktop panel, tablet drawer and mobile fullscreen verified.
3. PASS — Escape closes shared inspectors.
4. PASS — focus and list/query context restore tests pass.
5. PASS — Literature/Paper regression tests pass.
6. PASS — Task regression tests pass.
7. PASS — Run, Resource and Submission regression tests pass.
8. PASS — `/tasks` reads Research tasks from `GlobalTaskService`.
9. PASS — canonical Task IDs are unique.
10. PASS — Global status mutation is visible through the project-filtered service query.
11. PASS — Area and Project filters tested; Study/Work create no mock tasks.
12. PASS — Calendar and Timer A01-2 tests pass.
13. PASS — stable lazy-loaded deep links and Resume tests pass.
14. PASS — a non-zero duration below 60 seconds displays `<1 min`.
15. PASS — detailed seconds remain unchanged in the canonical TimeEntry.
16. PASS — root `--surface` is defined; no unresolved `var(--surface)` remains.
17. PASS — ESLint executes with zero errors.
18. PASS — route lazy loading preserves URLs and navigation.
19. PASS — TypeScript, Build, Tests and diff check pass.
20. PASS — modules 001–006 retain passing primary regression flows.

## Known limitations

- ESLint reports 12 historical warnings; they are not auto-fixed to avoid unrelated refactoring.
- Global Tasks is a reliable list foundation, not a board or batch-edit product.
- Only real Research tasks exist; Study and Work areas intentionally have empty results.
- IndexedDB remains device-local; multi-tab real-time invalidation and cloud synchronization remain unsupported.
- Inspector focus is restored to the triggering control when that control remains mounted; deep-link entry without an originating control falls back to the document naturally.

## Independent QA decision

Re-run the commands, inspect the complete Git diff from `9b4e1ac3e216abe4c12271c81d751b47ea7c6b8d`, and return exactly one decision:

- `ACCEPTED`
- `ACCEPTED WITH FIXES`
- `REJECTED`
- `INSUFFICIENT EVIDENCE`

For every issue, report Issue ID, severity, file/line, evidence, expected behavior, actual behavior, recommended fix, and impacted modules. Do not modify code during Review Only.
