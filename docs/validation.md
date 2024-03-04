# Validation status

| Check | Status |
| --- | --- |
| Agent, tool, quota and scoring checks | 21 Node tests passed |
| Python source and quota checks | Six passed in acquisition workflow 39029801385, including original-byte checks for 35 retrieved records; source-only checkout skips the raw-artifact integration check |
| Source syntax | 21 application/core/evaluator/test TypeScript files passed transpilation diagnostics |
| Strict TypeScript core checks | Seven core modules passed |
| SQL quality gates | Eight gates passed on the browser-reviewed corpus |
| Frozen task integrity | 20 development / 40 held-out tasks; seed/task hashes and related-trial separation passed |
| Source coverage | 29 real FDA announcements reviewed through browser research; 30 cited NCT IDs |
| Original FDA/registry/Drugs@FDA acquisition | 30 trial records and five Drugs@FDA queries acquired; all eight product formulations matched. FDA announcement downloads blocked by publisher abuse detection; current corpus remains `browser-reviewed-seed` |
| Model inference and paired evaluation | GitHub Actions secret supplied; first development run pending verification |
| Full framework typecheck and web build | Passed in GitHub Actions run 39029463599, commit ba7a9f005127b025445f8ffcdfa8919a28e71662 |
| D1 migration generation and application | Generation passed in that run; hosted application pending publication |
| Browser layout and keyboard QA | Pending a working web build |
| Public hosting and five fresh investigations | Pending; Sites source synchronization is blocked by current outbound networking restrictions |

The isolated model fixtures in unit tests are not presented as real-model inference. The public evaluation report states `not_run` and contains no accuracy claim. Source paraphrases are not presented as original excerpts, and missing registry snapshots have no invented status fields.
