# What the completed evaluation exposed

The held-out agent scored 17/40 strict successes against 19/40 for the same-model BM25 baseline. The 34/40 target was not met. A successful build and one successful browser investigation do not establish reliable answers across this task set.

## Observed failures

- **Unavailable answers:** 15 agent and 14 baseline responses. Eleven agent responses ended with unobserved-record validation errors; four ended with numeric-interpretation validation errors. Baseline counts were one and thirteen respectively. These are failed tasks, not successful refusals.
- **Unsupported interpretation:** source-support review rejected available answers that asserted standard-of-care or practice changes, assumed administration savings, changed treatment phase/eligibility, or confused a registry retrieval period with evidence timing.
- **Formulation selection:** one agent answer selected Qvantig in an IV nivolumab/ipilimumab context. Grounded source records alone do not guarantee correct selection.
- **Overly broad numeric rejection:** the current validator rejects digits in commercial interpretation and follow-up text except allowed identifiers. This can reject legitimate contextual wording as well as invented outcomes. The rejected final draft text was not retained, so individual numeric errors cannot all be attributed to a specific phrase.

## Measurement limits

Strict scoring combines exact field requirements with recorded Codex-assisted source-support review. Three semantically appropriate agent refusals and two baseline refusals still fail exact empty-selection references because they display supported event/product cards. Those scoring decisions are retained; references were not relaxed after seeing the answers.

The twenty development tasks cover event/date and trial-link categories. Formulation and unsupported-request categories appear only in the held-out set. This limits development coverage and should be corrected in a future, separately versioned benchmark.

Semantic review is AI-assisted, not independent human or clinical adjudication. It can share systematic errors with generated answers and authored labels. Wilson intervals are descriptive and do not correct for related tasks or reviewer uncertainty. Latencies include benchmark pacing and are not production service-level measurements.

## What remains before a stronger version

Improve bounded citation repair, distinguish allowed source-grounded numeric context from invented outcome claims, and add observability for rejected drafts without storing credentials. Develop against the existing development set and explicitly labelled diagnostic cases. Any claim of improved generalization needs a fresh, separately frozen evaluation with adequate category coverage and new source groups; do not relabel this exposed held-out set as untouched.

Public hosting and fresh deployed-site checks remain blocked by the source-server connection. Local production-build browser QA passed eighteen checks and is reported separately.
