# SignalDesk AI

**Oncology competitive intelligence, connected to evidence.**

[Source repository](https://github.com/f20230125-sudo/-signaldesk-ai)

Investigate documented FDA developments, resolve product formulations, inspect the cited trials and export a source-backed commercial brief.

The initial collection contains **29 real FDA announcements, eight product formulations and 30 FDA-cited NCT identifiers**, covering January 2024–October 2026. The selected watchlist includes KEYTRUDA, OPDIVO, IMFINZI, TECENTRIQ and LIBTAYO, with separate subcutaneous formulations.

## Current validation status

The source summaries have been browser-reviewed against official FDA announcements. Original-byte acquisition and registry snapshots are **pending**. The app identifies this mode explicitly; summaries are not displayed as original quotations.

The agent, evidence tools, public-app source and frozen **20-development / 40-held-out** task set are implemented. **Real-model evaluation has not run**, and no model accuracy result is claimed. The app requires a server-side free-tier Gemini key and persistent request allowance before it enables live investigations. Public deployment is not yet verified.

Verification: **21 agent/tool/scoring tests and five Python checks passed**, with one original-source integrity check explicitly skipped in the source-only checkout. The full framework typecheck, database migration generation and web build passed in [GitHub Actions](https://github.com/f20230125-sudo/-signaldesk-ai/actions/runs/39029463599). Browser QA and public deployment remain pending. See the [validation record](docs/validation.md).

## Investigation workflow

1. Filter the event feed by product, indication and approval year.
2. Open an event to inspect its approved population, evidence notes and cited trial identifiers.
3. Ask a competitive question. The model resolves products, searches events, reads evidence and requests trial records through typed tools.
4. Inspect documented facts separately from possible commercial relevance and follow-up questions.
5. Export the brief, including its sources, model identity, snapshot and limitations.

For example, the Imfinzi and Opdivo resectable NSCLC announcements identify different approval dates and supporting studies. The agent must preserve the populations and biomarker exclusions, and must not infer clinical superiority from separate trials.

## Architecture

```mermaid
flowchart LR
    FDA[Official FDA announcements] --> P[Python acquisition and SHA-256 receipts]
    CT[ClinicalTrials.gov records] --> P
    DF[Drugs@FDA metadata] --> P
    P --> SQL[DuckDB warehouse and source checks]
    SQL --> C[Versioned evidence corpus]
    C --> T[Typed evidence tools]
    G[Free-tier Gemini] --> A[Bounded investigation agent]
    T <--> A
    A --> UI[Evidence workspace and exported brief]
    A --> E[Paired task evaluation]
```

Python prepares the data. The TypeScript agent and its tools run unchanged in the evaluation runner and hosted application. Facts are hydrated from observed source records. Referenced event, passage, product and trial IDs are validated; unavailable evidence stays unavailable. Generated numeric interpretation is rejected.

The agent has at most four model calls, eight tool executions and a one-minute timeout. The public endpoint uses persistent daily request and model-call limits, origin checking and server-only credentials. There is no silent mock-model fallback.

## Run locally

Python 3.11+ and Node 24:

```powershell
python -m pip install -e ".[test]"
python tools/acquire.py
python tools/build_corpus.py
npm ci
npm run db:generate
node --experimental-strip-types --test tests/tools.test.ts
python -m pytest -q tests/python
node tools/check-freeze.mjs
npm run dev
```

To inspect the reviewed summaries before network acquisition, use `python tools/build_corpus.py --seed-only`. This mode is clearly labelled and is not accepted for the final held-out benchmark.

Copy `.env.example` to an ignored local environment file and configure the free-tier model key. Production runtime values belong in secure hosting settings. No keys belong in Git, the browser bundle or a portfolio archive. See [runbook](docs/runbook.md).

## Evaluation

The benchmark is developer-authored and source-reviewed, with no independent clinical adjudication. Events sharing a supporting trial stay in the same split. The task file and seed have frozen hashes, checked by CI.

The agent is compared with BM25 retrieval plus a single response using the same model and corpus. Results record exact event selection, product identity, trial links, evidence coverage, semantic audit, latency and usage. Automatic field checks and source-quote existence are not general answer accuracy. Strict scores require a recorded semantic audit of every answer.

See [evaluation method](docs/evaluation.md), [frozen task manifest](data/evaluation/freeze.json) and [current report](data/evaluation/report.json).

## Sources and boundaries

- [FDA oncology approval notifications](https://www.fda.gov/drugs/resources-information-approved-drugs/oncology-cancerhematologic-malignancies-approval-notifications)
- [ClinicalTrials.gov API](https://clinicaltrials.gov/data-api/api)
- [Drugs@FDA API](https://open.fda.gov/apis/drug/drugsfda/)

This is a selected announcement collection, not a complete approval history. An event date and a current trial snapshot are different observations. FDA and Drugs@FDA are related sources, not independent corroborators. US events do not establish UAE authorization. Possible business relevance is a hypothesis for review, not measured commercial impact.

Independent portfolio work using public evidence. No MSD affiliation or internal data is claimed.
