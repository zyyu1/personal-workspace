# Workspace persistence

The Research Workspace uses one `RepositoryContract` per canonical domain and a replaceable `PersistenceAdapter`.

- Browsers use `IndexedDbPersistenceAdapter` with database `personal-workspace`.
- Tests and non-browser runtimes use `MemoryPersistenceAdapter`.
- Domain records are stored as versioned envelopes in the `records` object store.
- `migration-backups` receives the complete previous envelope before every schema migration or seed merge.
- A missing domain record is initialized once from its Demo seed. Reading an existing record never inserts the seed again.
- Increasing `schemaVersion` requires an explicit `migrate` function.
- Increasing `seedVersion` requires a non-destructive `mergeSeed` function. Without one, loading fails instead of replacing user data.
- Repository mutations are serialized. The in-memory cache is updated only after the adapter confirms the durable transaction.

## Known limitations

- Persistence is local to this device/browser profile; it is not cloud synchronization.
- Multiple tabs do not receive real-time repository Cache Invalidation.
- Writes spanning multiple repositories do not share one atomic transaction.
- There is no user-facing data export or restore interface.
- There is no server backup or cross-device conflict resolution.
- Replacing the active adapter requires every related Repository cache to be explicitly invalidated or reconstructed.
- Migration backup and the corresponding domain write use separate IndexedDB transactions. A failed final write leaves the original envelope authoritative; the staged backup supports diagnosis/recovery and the migration is retried on the next load.

A future backend adapter should implement the same `PersistenceAdapter` contract and preserve the envelope/migration guarantees.
