# Validation status

| Check | Status |
| --- | --- |
| Agent, tool, quota and scoring checks | 21 Node tests passed |
| Python source and quota checks | Five passed; original-byte integrity test skipped pending acquisition |
| Source syntax | 21 application/core/evaluator/test TypeScript files passed transpilation diagnostics |
| Strict TypeScript core checks | Seven core modules passed |
| SQL quality gates | Eight gates passed on the browser-reviewed corpus |
| Frozen task integrity | 20 development / 40 held-out tasks; seed/task hashes and related-trial separation passed |
| Source coverage | 29 real FDA announcements reviewed through browser research; 30 cited NCT IDs |
| Original FDA/registry/Drugs@FDA acquisition | Pending; current corpus is explicitly marked `browser-reviewed-seed` |
| Model inference and paired evaluation | Not run; no configured Gemini key |
| Full framework typecheck and web build | Pending; required packages are missing from the offline dependency cache |
| D1 migration generation and application | Pending complete framework dependencies |
| Browser layout and keyboard QA | Pending a working web build |
| Public hosting and five fresh investigations | Pending; Sites source synchronization is blocked by current outbound networking restrictions |

The isolated model fixtures in unit tests are not presented as real-model inference. The public evaluation report states `not_run` and contains no accuracy claim. Source paraphrases are not presented as original excerpts, and missing registry snapshots have no invented status fields.
