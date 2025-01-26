# Runbook

## Original sources

`python tools/acquire.py` downloads the 29 curated FDA announcements, 30 cited trial records and five brand-level Drugs@FDA queries. It records original byte hashes, size and retrieval time in `data/source-manifest.json`. Failures are explicit and prevent a complete-acquisition claim.

`python tools/build_corpus.py` verifies hashes, checks that the stated approval dates and cited NCT IDs occur in the original announcement, and writes a versioned corpus and DuckDB warehouse. It fails on a seed/source discrepancy. A date discrepancy must be reviewed against the original body, not silently normalized to an index date.

`--seed-only` permits browser-reviewed summaries for development; it never invents trial status or labels a summary as an original quotation. Original sources can be acquired through the repository's explicit acquisition workflow when local networking is unavailable. Source artifacts retain original bytes; checked derived outputs can then be committed.

## Model and public endpoint

Use a Gemini project without paid billing. Configure `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash-lite`, a random `SIGNALDESK_RATE_SALT`, and model/request daily limits through secure runtime settings. Verify the actual project quota and set the app's allowance below it. Never connect paid billing as an automatic fallback.

The app requires D1 `DB` and its `quotas` table. Generate schema migrations using `npm run db:generate`, inspect the SQL, and apply local migrations using the Sites starter workflow before testing the public endpoint. Sites applies hosted schema migrations during supported publication.

Request allowances fail closed if the database is unavailable. IP addresses are HMAC-hashed before use in quota keys. The app does not persist conversations or questions in a public shared database. Daily quota rows contain only a salted identifier, counter and expiry value. Expired counters can be removed by a maintenance command after their retention period; request handling never creates schema.

## Hosting

The app uses the Sites Vinext starter. Preserve its `sites()` integration and persisted project identity in `.openai/hosting.json`. Build with the supported Sites helper, synchronize the exact source state and publish only the matching saved version. Verify five fresh real-model investigations after publication. An allocated Site URL is not proof of successful deployment.

Current workspace restrictions block outbound sockets and the Sites source synchronization endpoint. Full dependency installation also needs packages absent from the local cache. These are explicit delivery gates; do not mark hosting or browser QA complete without observed results.

## Delivery archive

`python tools/package.py` builds `SignalDesk-AI-Portfolio.zip` using explicit public directories. It excludes environment secrets, private runs, dependency caches, raw downloads and application notes.
