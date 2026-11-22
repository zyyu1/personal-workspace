# Module 008 OSS Reuse Review

Reviewed on 2026-11-21 before implementation. The checks used the GitHub repository API and license metadata. No third-party source was copied and no dependency was added.

| Project | Verified state | Decision |
|---|---|---|
| [Saxermi/study_tracker](https://github.com/Saxermi/study_tracker) | MIT; Python; 1 star; latest commit `abff5db13679` on 2026-11-20 | Conceptual reference only. Its Python application and storage model are not compatible with the accepted React/TypeScript canonical repositories. |
| [JStanoeva/course-tracker](https://github.com/JStanoeva/course-tracker) | MIT; TypeScript; 1 star; latest commit `c6def208c9e5` on 2025-09-20 | Conceptual reference only. No Supabase/backend state was imported. |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | MIT; TypeScript; 887 stars; latest commit `7e29947ad385` on 2026-11-19 | Not integrated. Module 008 requires explicit review flags and dates, not an automatic spaced-repetition scheduler. |

The implementation reuses the workspace's accepted `InspectorShell`, `StudyRepository`, `GlobalResourceService`, `GlobalTaskService`, `TimeEntryService`, and `WorkspaceResumeService`. This keeps stable identities and avoids introducing a second backend, task store, resource store, or progress database.
