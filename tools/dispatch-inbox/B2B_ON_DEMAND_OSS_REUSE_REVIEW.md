# B2B V1.1 OSS Reuse Review

Snapshot verified through GitHub GET requests on 2026-11-21 before implementation.

| Project | Stars | Latest commit | License / stack | Windows complexity | Reuse, adaptation cost and risk |
| --- | ---: | --- | --- | --- | --- |
| [openai/codex](https://github.com/openai/codex) | 136,041 | `1145028ae47e` — 2026-11-21 | Apache-2.0 / Rust | Low to invoke the already installed official CLI; high to fork | Reuse only the documented `codex queue --thread --message` boundary. No fork, resume, database access or host integration. Queue exit zero remains submission, not ACK. |
| [cli/cli](https://github.com/cli/cli) | 47,124 | `de06af2c2ea5` — 2026-11-20 | MIT / Go | Low; already used by B1 on Windows | Reuse the bounded GET-only `GhApiClient`. No extra dependency or write scope. Risks remain authentication, rate limiting and host availability. |
| [songyb111-gachon/codex-auto-resume-windows](https://github.com/songyb111-gachon/codex-auto-resume-windows) | 93 | `eb3d979e1289` — 2026-11-21 | MIT / Python | Medium–high to integrate | Operational reference only. Its auto-resume/background goals conflict with B2B V1.1, so no code, dependency, daemon or installation is reused. |

The reuse decision is deliberately small: retain the accepted B1/B2A parser,
GitHub adapter, local config, lock, durable Outbox and official queue sender.
The on-demand receiver adds orchestration and an inert launcher template only.
`codex queue --help` was inspected read-only and no queue submission was made.
