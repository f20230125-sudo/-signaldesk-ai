# Vercel deployment

The public evidence dashboard is live at **https://signaldesk-ai-phi.vercel.app**. Production deployment `dpl_D4DhAVAfJ4quqQTBqjfUrELDPnp6` built commit `20d5c16d9fd42cd716c347c2734b9802b93f579b` and reached READY. Thirteen unauthenticated HTTP checks passed. Live AI is paused until its production secrets and persistent Redis quota database are configured; hosted real-model and interactive browser verification remain pending.

SignalDesk now has a standard Next.js build for Vercel alongside its retained Sites/Cloudflare build. The Vercel configuration runs `npm run build:vercel` and uses the Next.js preset. Use Node 24 and the repository root directory.

## Import

Import `f20230125-sudo/-signaldesk-ai` from GitHub into your own Vercel account, using branch `main`. Name the Vercel project `signaldesk-ai`. The tracked `vercel.json` supplies build and installation commands. Keep the default Next.js output directory. An import or generated project URL is not evidence of a successful deployment; wait for Ready and verify the live app.

## Runtime settings

Add these **server-only** environment variables in Vercel project settings. Never prefix them with `NEXT_PUBLIC_` or put values in GitHub source.

| Variable | Value |
| --- | --- |
| `GEMINI_API_KEY` | Your existing Gemini key, using the intended project quota |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
| `SIGNALDESK_RATE_SALT` | A long random secret, for example generated using `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` |
| `SIGNALDESK_DAILY_MODEL_CALL_LIMIT` | `120` or a lower positive allowance appropriate to your provider quota |
| `SIGNALDESK_VISITOR_REQUEST_LIMIT` | `5` |
| `UPSTASH_REDIS_REST_URL` | HTTPS REST URL of your persistent Upstash Redis database |
| `UPSTASH_REDIS_REST_TOKEN` | Database REST write token |

A Redis database connected through the Vercel Marketplace may supply `KV_REST_API_URL` and `KV_REST_API_TOKEN` instead; these names are supported too. Use a persistent database in your account, rather than an expiring scratch instance. Choose the appropriate plan yourself; no paid plan or automatic upgrade is required by the code.

The quota script atomically checks the allowance, increments and sets expiry in one Redis operation, shared across function instances and deployments using the same database. It stores salted visitor identifiers and counts, never questions or conversation content. The public app's `x-vercel-forwarded-for` header supplies the visitor address on Vercel. Local Node development uses a shared anonymous visitor unless a trusted platform provides it.

Missing Redis credentials, failed storage, missing request protection or missing Gemini credentials pause live investigations. The evidence feed still works. An in-memory quota fallback is deliberately absent. Do not report the AI endpoint as deployed successfully until its real hosted path is tested.

## Verify

1. Confirm the deployment is Ready, open the public page, filter events and inspect sources and trial details.
2. Run five real-model investigations within the configured allowance and inspect the returned sources and exports. The sixth request from the same visitor should be rejected for that UTC day with the default visitor limit.
3. Confirm the allowance persists after a redeploy, and that browser JavaScript and network responses contain no credentials.
4. Confirm a disallowed Origin is rejected, unavailable evidence remains explicit, and quota/provider outages produce an unavailable result.

Local Node preview: `npm run dev:vercel`. Vercel production build: `npm run build:vercel`. Existing Sites commands and D1 migrations retain their original purpose; Vercel uses Redis instead of D1.

References: [Vercel Git imports](https://vercel.com/docs/git), [environment settings](https://vercel.com/docs/environment-variables), [trusted request headers](https://vercel.com/docs/headers/request-headers), [Upstash REST commands](https://upstash.com/docs/redis/features/restapi).
