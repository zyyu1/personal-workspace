# Module 007 OSS reuse review

Review date: 2026-11-21. Values below are the GitHub state observed during implementation, not the historical design snapshot.

| Candidate | Stars | Last observed commit | License | Stack | Integration | Decision |
| --- | ---: | --- | --- | --- | --- | --- |
| [zip.js](https://github.com/gildas-lormeau/zip.js) | 3,916 | `955ce6541ca8` (2026-11-17) | BSD-3-Clause | JavaScript, Web Streams | Medium | Selected, version `2.25.0` |
| [fflate](https://github.com/101arrowz/fflate) | 3,096 | `dcb3714a6c25` (2026-05-16) | MIT | TypeScript/JavaScript | Low–Medium | Not added |
| [JSZip](https://github.com/Stuk/jszip) | 10,400 | `609d95f4098a` (2026-09-09) | `(MIT OR GPL-3.0-or-later)` in npm metadata | JavaScript | Low–Medium | Not added |

zip.js was selected because its central-directory model exposes encrypted, symlink, executable, compressed-size, uncompressed-size and compression-method metadata without extracting files. It is used only for format parsing. Workspace code separately enforces path normalization, source/entry/expanded-size limits, compression-ratio limits, unsupported method rejection and index-only behavior.

Known residual risk: central-directory metadata is not proof that decompressed bytes are benign. V1.0 never executes or extracts entries, never stores archive bytes in IndexedDB, and never claims that an indexed file is permanently available. Any later extraction or managed-storage feature requires a separate streaming byte-limit review.

Capability inventory:

- Browser directory picker: supported only when the browser exposes `showDirectoryPicker`, after an explicit user action. The persisted result is a metadata snapshot; handles and byte access are not promised after refresh.
- Local Connector: not present.
- Managed Storage: not present. Its wizard action is disabled.
