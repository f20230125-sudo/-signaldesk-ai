# Evaluation protocol

Version v1 fixes 20 development tasks and 40 held-out tasks. The reference facts are developer-authored and reviewed against official announcement pages; they have no independent clinical adjudication. Related events sharing a trial are assigned to the same split. The benchmark includes 12 date/event tasks, ten product/formulation tasks, ten trial-link tasks and eight unsupported-request tasks in the held-out set.

The seed and tasks are hashed in `data/evaluation/freeze.json`. Run `node tools/check-freeze.mjs` to verify integrity and group separation. Do not edit frozen questions or references to improve a result; create a separately versioned benchmark if correction is necessary and retain the original run.

## Systems

- **Baseline:** BM25 ranks up to 12 evidence passages using their text and associated approval-date, product and trial metadata, then the same model produces one structured response with associated event/trial records. It has no adaptive tool loop.
- **Agent:** the same model selects typed tools and reads their results before returning the structured brief. It has at most four calls and eight tool executions.

The comparison measures the complete systems, including evidence access and call budgets. It does not isolate reasoning alone or establish that additional agent calls cause improvement. Report input/output tokens and elapsed time alongside correctness.

## Execution

Supply the free-tier key through secure environment settings, then explicitly enable a run:

```powershell
$env:SIGNALDESK_LIVE_EVAL='1'
node --env-file=.env.local --experimental-strip-types tools/evaluate.ts --dev
node --env-file=.env.local --experimental-strip-types tools/evaluate.ts
```

Final held-out runs require a complete original-source corpus. Development-only seed runs require the explicit `--allow-seed` flag and remain separate. The runner fingerprints corpus, frozen tasks, model and agent/tool implementations; completed responses resume only within the same fingerprint. Quota interruption stops the run and preserves progress. Service failures and timeouts remain visible.

The GitHub evaluation workflow reads the `GEMINI_API_KEY` Actions secret. Start a run through Actions → Run opt-in SignalDesk evaluation → Run workflow. Normal pushes and verification CI do not call the model. Select the split; only development permits the labelled seed option. Calls are paced, concurrent evaluation runs are queued, and there is no automatic paid-provider fallback. Development output is saved separately in `reports/development-evaluation.json`; the held-out report is unchanged by a development run.

Before inference, the workflow checks model visibility and requests a small structured response. The current default is `gemini-3.5-flash-lite`; Google limits legacy 2.5 access for new users ([model guidance](https://ai.google.dev/gemini-api/docs/deprecations)). The initial 2.5 attempt returned HTTP 404 for all requests and produced no usable answers; its receipts remain in [run 39029936943](https://github.com/f20230125-sudo/-signaldesk-ai/actions/runs/39029936943). A successful workflow exit alone is not evidence of successful inference.

Reruns can restore completed responses from the public report only when its model/code/corpus/task fingerprint matches. Quota-interrupted responses are retried; completed responses are reused. Raw outputs remain available in the workflow artifact.

## Scoring and review

Automatic checks score exact event sets, product identities, required trial links and evidence coverage. Structured facts come from the corpus, but selecting the correct facts and interpreting them still require evaluation.

Every answer requires a semantic review recorded in `reports/runs/<fingerprint>/manual-audit.json` as an object keyed by `<task-id>-<system>`, with `semantic_pass`, `reviewer`, and `notes`. The reviewer must inspect dates, qualifiers, source support, relevant omissions and unsupported conclusions. Merely finding a quoted passage is insufficient. Re-run the evaluator with the same fingerprint to incorporate completed reviews without calling the model for already completed tasks.

Strict success is the automatic check AND semantic audit. The public report remains partial until all 40 paired tasks and audits are complete. Only a complete audited test run publishes strict success rates and Wilson intervals. Small, related, developer-authored tasks do not establish clinical accuracy or general commercial performance.

The target is at least 34/40 strict agent successes. Report actual scores and failures even when the target or baseline comparison is unfavorable. Do not tune prompts on failed held-out cases and present the same set as untouched.
