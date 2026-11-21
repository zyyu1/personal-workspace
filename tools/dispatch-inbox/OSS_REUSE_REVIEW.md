# B1 Open-Source Reuse Review

Snapshot date: 2026-11-21. Metadata was read from GitHub immediately before implementation.

| Project | Stars | Latest observed commit | License | Stack / Windows / deployment | B1 reuse decision and cost |
| --- | ---: | --- | --- | --- | --- |
| `openai/codex` | 136,025 | `1145028ae47e8119955323d38ce34122d418f951` (2026-11-21) | Apache-2.0 | Rust; official CLI; Windows installer documented | Interface and safety semantics reference only. B1 must not call `codex`; forking or server changes would be high-cost and out of scope. |
| `cli/cli` | 47,118 | `de06af2c2ea536d5722fda35dc2001565f9b9f64` (2026-11-20) | MIT | Go; official prebuilt `gh` client; Windows supported | Preferred read-only API adapter when already installed. Low integration cost; auth scopes and rate limits remain operational risks. It is absent on this host, so B1 returns `UNAVAILABLE` and does not install it. |
| `songyb111-gachon/codex-auto-resume-windows` | 93 | `0e119e253f4b306370d013f35d0f47c2ada983b8` (2026-11-17) | MIT | Python; Windows-focused packaged application; install/runtime coupling | Concepts only: exact identity, fail closed, dedupe and redacted diagnostics. Its quota-resume watcher is a different purpose and creates version/deployment risk. No source copied and nothing installed. |

Implementation uses Python 3 standard library only. This avoids a new GitHub SDK, daemon, listener, service or background installer. The current host provides Python 3.13, while the default `python` command is 3.11.3; tests and smoke use `py -3.13` explicitly.
