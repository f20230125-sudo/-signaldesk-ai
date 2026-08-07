# Validation status

| Check | Status |
| --- | --- |
| Agent, tool, quota, scoring and hosting checks | 31 Node tests passed |
| Python source and quota checks | Nine passed locally; source-only checkout skips the raw-artifact integration check. Six earlier checks passed in acquisition workflow 39029801385, including original-byte checks for 35 retrieved records |
| Source syntax | 31 application/core/evaluator/test TypeScript files passed transpilation diagnostics |
| Strict TypeScript core checks | Seven core modules passed |
| SQL quality gates | Eight gates passed on the browser-reviewed corpus |
| Frozen task integrity | 20 development / 40 held-out tasks; seed/task hashes and related-trial separation passed |
| Source coverage | 29 real FDA announcements reviewed through browser research; 30 cited NCT IDs |
| Original FDA/registry/Drugs@FDA acquisition | 30 trial records and five Drugs@FDA queries acquired; all eight product formulations matched. FDA announcement downloads blocked by publisher abuse detection; all 29 publisher field reviews and selected proof captures are complete under protocol v2; current corpus is `source-reviewed`. Original HTML acquisition remains incomplete |
| Model inference and paired evaluation | Gemini 3.5 key access and structured generation passed. Completed run 39033933026: 20 development and 40 held-out paired tasks; 120 Codex-assisted source-support reviews recorded. Held-out strict successes: agent 17/40, BM25 19/40. Target 34/40 not met |
| Full framework typecheck and both hosting builds | Passed in [GitHub Actions run 39057789310](https://github.com/f20230125-sudo/-signaldesk-ai/actions/runs/39057789310), including Sites/Cloudflare and standard Next.js for Vercel |
| Vercel persistent quota adapter | Production Redis connected through Vercel Marketplace. Sixth investigation request returned 429; the same test visitor remained limited on a newly built deployment. Isolated tests also cover failed storage and malformed replies |
| D1 migration generation and application | Generated migration committed and quota behavior checked against it; hosted application pending publication |
| Production browser and API QA | 18 checks passed in run 39034901430: Chromium desktop/mobile, keyboard focus, actual Gemini answer, export, key exclusion and persistent quotas. Local production runtime, not public deployment |
| Public Vercel hosting and browser QA | READY at [signaldesk-ai-phi.vercel.app](https://signaldesk-ai-phi.vercel.app). 24 hosted checks passed, including Chromium desktop/mobile, filters, evidence drawer, keyboard focus, live browser answer/export, client credential-identifier exclusion and quota-error UI. No browser JavaScript exceptions. See [hosted QA receipt](../reports/hosted-qa.json) |
| Five hosted real-model investigations and Redis persistence | Five attempted: two complete, three unavailable after Gemini quota errors. Gemini integration and Redis persistence across redeployment are verified; five completed hosted investigations are not claimed. Exact provider quota/reset window was not inspected. The temporary QA sandbox was stopped |

The isolated model fixtures in unit tests are separate from real inference receipts. The held-out report is complete, with case-level review decisions and descriptive Wilson intervals. Source-support review was performed through Codex, with no independent human or clinical adjudication. The agent did not outperform BM25; the prototype is not presented as production-ready. Earlier development diagnostics remain separate. Source paraphrases are not presented as original excerpts, and missing registry snapshots have no invented status fields.
