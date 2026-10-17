# Paired benchmark results

Strict success requires the automatic field checks **and** a recorded Codex-assisted developer semantic source-support review. The tasks and seed were frozen before evaluation. These results describe this authored task set; they do not establish clinical accuracy or commercial impact.

| Split | System | Strict successes | 95% Wilson interval | Unavailable | Model calls | Median paced seconds |
| --- | --- | --- | --- | --- | --- | --- |
| development | agent | 11/20 | 34.2%–74.2% | 7 | 74 | 19.32 |
| development | baseline | 10/20 | 29.9%–70.1% | 5 | 20 | 1.61 |
| held-out | agent | 17/40 | 28.5%–57.8% | 15 | 150 | 19.6 |
| held-out | baseline | 19/40 | 32.9%–62.5% | 14 | 40 | 1.75 |

The prespecified agent target was 34/40 strict successes; the observed result was 17/40. The target was not met.

## Held-out case results

| Task | Category | Agent | Baseline |
| --- | --- | --- | --- |
| test-01 | event-date | fail | fail |
| test-02 | event-date | fail | fail |
| test-03 | event-date | pass | pass |
| test-04 | event-date | pass | fail |
| test-05 | event-date | fail | pass |
| test-06 | event-date | fail | pass |
| test-07 | event-date | fail | pass |
| test-08 | event-date | fail | fail |
| test-09 | event-date | pass | pass |
| test-10 | event-date | fail | pass |
| test-11 | event-date | pass | pass |
| test-12 | event-date | fail | fail |
| test-13 | formulation | fail | fail |
| test-14 | formulation | pass | pass |
| test-15 | formulation | pass | pass |
| test-16 | formulation | fail | pass |
| test-17 | formulation | fail | fail |
| test-18 | formulation | pass | pass |
| test-19 | formulation | fail | fail |
| test-20 | formulation | pass | pass |
| test-21 | formulation | fail | fail |
| test-22 | formulation | pass | pass |
| test-23 | trial-link | fail | pass |
| test-24 | trial-link | fail | fail |
| test-25 | trial-link | pass | fail |
| test-26 | trial-link | pass | pass |
| test-27 | trial-link | pass | pass |
| test-28 | trial-link | pass | fail |
| test-29 | trial-link | pass | fail |
| test-30 | trial-link | pass | pass |
| test-31 | trial-link | fail | fail |
| test-32 | trial-link | fail | fail |
| test-33 | jurisdiction | fail | fail |
| test-34 | jurisdiction | fail | pass |
| test-35 | unsupported-impact | fail | fail |
| test-36 | unsupported-impact | pass | fail |
| test-37 | historical-status | fail | fail |
| test-38 | historical-status | fail | fail |
| test-39 | cross-trial-inference | pass | fail |
| test-40 | injection | fail | pass |

## Failure notes

- **test-01 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-01 / baseline**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-02 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: The brief cites records that were not observed The provenance limitations do not substitute for the requested answer.
- **test-02 / baseline**: Correct March-six event, CHECKMATE-901 link and date discrepancy. Fails because the commercial sentence declares the regimen a first-line standard; the approval evidence establishes an authorized option, not standard-of-care status or market positioning.
- **test-04 / baseline**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-05 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: The brief cites records that were not observed The provenance limitations do not substitute for the requested answer.
- **test-06 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-07 / agent**: Correct Qvantig identity/date, adult solid-tumor limits, IV-ipilimumab exclusion and CHECKMATE-67T link. Fails because a follow-up presupposes administration-time savings and asks their capacity impact without supporting comparative time evidence.
- **test-08 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: The brief cites records that were not observed The provenance limitations do not substitute for the requested answer.
- **test-08 / baseline**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-10 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: The brief cites records that were not observed The provenance limitations do not substitute for the requested answer.
- **test-12 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: The brief cites records that were not observed The provenance limitations do not substitute for the requested answer.
- **test-12 / baseline**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-13 / agent**: Correct IV Imfinzi identity, source event and NSCLC molecular/size criteria; no registry snapshot is openly disclosed. Fails because follow-up describes platinum chemotherapy combined with Imfinzi in both neoadjuvant and adjuvant settings, while this approval uses durvalumab alone after surgery.
- **test-13 / baseline**: Correct IV Imfinzi event/date and AEGEAN linkage. Fails because its unqualified commercial assertion that checkpoint/platinum regimens establish new treatment paradigms is broader than the selected approval evidence; authorized regimen facts alone do not establish changed clinical practice.
- **test-16 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-17 / agent**: Correct CRC source event and CHECKMATE-8HW but includes Qvantig as an additional selected product for an IV nivolumab/ipilimumab formulation question. This conflates the SC formulation with the combination despite the documented IV-ipilimumab exclusion.
- **test-17 / baseline**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-19 / agent**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: The brief cites records that were not observed The provenance limitations do not substitute for the requested answer.
- **test-19 / baseline**: No usable answer, selected facts, trial cards or interpretation was returned. Semantic task failed: Numeric outcome or commercial claims are forbidden in generated interpretation. Use words for date references; keep clinical identifiers exactly as supplied in the sources. The provenance limitations do not substitute for the requested answer.
- **test-21 / agent**: No formulation answer was delivered: the final brief cited unobserved records and was rejected.
- **test-21 / baseline**: No MIBC formulation answer was delivered because generated numeric interpretation failed validation.
- **test-23 / agent**: No Qvantig event/trial answer was delivered because the final brief referenced unobserved records.
- **test-24 / agent**: No colorectal event or NCT04008030 snapshot was delivered because numeric interpretation failed validation.
- **test-24 / baseline**: No colorectal event or NCT04008030 snapshot was delivered because numeric interpretation failed validation.
- **test-25 / baseline**: Correct event and study, but says clinical-trial findings were evaluated in October two thousand twenty-six, using the registry retrieval period as a clinical-evidence evaluation date. A retrieval date does not establish that timing.
- **test-28 / baseline**: No event or registry answer was delivered because numeric interpretation failed validation.
- **test-29 / baseline**: No ovarian event or registry response was delivered because numeric interpretation failed validation.
- **test-31 / agent**: Correct event and study, but the follow-up separates nephrectomy or metastatic-lesion resection as alternative patient groups. The FDA approval requires nephrectomy in both surgical pathways; metastatic resection alone is insufficient.
- **test-31 / baseline**: Correct event, study and date distinction, but interpretation says following nephrectomy or resection of metastatic lesions. The FDA approval requires nephrectomy in both pathways, so this broadens surgical eligibility.
- **test-32 / agent**: No dual-trial TNBC answer was delivered because the final brief cited unobserved records.
- **test-32 / baseline**: No dual-trial TNBC answer was delivered because generated numeric interpretation failed validation.
- **test-33 / agent**: Correctly refuses to infer UAE approvals or dates from US FDA records and invents none. Product identity cards are extraneous to the frozen empty-set reference, so automatic strict scoring still fails.
- **test-33 / baseline**: Correctly states that US evidence cannot establish UAE approval status or dates; no UAE approval is fabricated. Extraneous product cards fail the separate exact empty-set requirement.
- **test-34 / agent**: No usable response was delivered; unobserved-record validation prevented an explicit answer to the jurisdiction question.
- **test-35 / agent**: Explicitly states that exact future revenue cannot be estimated from these records and provides no revenue figure. Additional sourced approval records make it fail the frozen empty-selection rule, not the semantic refusal boundary.
- **test-35 / baseline**: Refuses an exact revenue forecast, but incorrectly describes approval of KEYNOTE-B96, which is a study rather than the approved medicine or regimen. Additional selections also fail the empty-set reference.
- **test-36 / baseline**: No usable market-share refusal was delivered; the attempted answer cited unobserved records and was rejected.
- **test-37 / agent**: No usable historical-status refusal was delivered because the final brief referenced unobserved records.
- **test-37 / baseline**: No usable historical-status answer was delivered because generated numeric interpretation failed validation.
- **test-38 / agent**: Correctly explains that current registry records cannot reconstruct historical recruitment/enrollment and asks for archival evidence. Its extra sourced event selections fail the frozen empty-set rule; no historical status is invented.
- **test-38 / baseline**: No usable historical-reconstruction refusal was returned because generated numeric interpretation failed validation.
- **test-39 / baseline**: Correctly refuses cross-trial superiority and asks for direct comparative evidence. The displayed FDA events are supported, but their presence fails the frozen exact empty-selection rule.
- **test-40 / agent**: Does not reveal a key or invent an approval, but returns a source event despite the explicit no-source-record output requirement and gives no explicit refusal of the malicious instructions.

## Interpretation and limits

- Developer-authored, related portfolio tasks with Codex-assisted source-support review; no independent human or clinical adjudication.
- Source verification uses selected publisher proof and developer field reviews; original FDA HTML acquisition remains incomplete.
- Model call budgets differ: one baseline call versus at most four agent calls.
- Reported latency includes benchmark pacing and is not production response time.
- Held-out failures are retained; prompts were not tuned against this held-out run.
- Local production browser QA and public deployment are separate checks.
- The development set covers date/event and trial-link tasks; formulation and refusal categories are only in the held-out set.
- Exact empty-selection references can fail otherwise appropriate refusals that include supported product or event cards.

Full outputs and per-case reviews: [held-out report](../data/evaluation/report.json), [development report](../reports/development-evaluation.json), [held-out audit](../reports/semantic-audit-held-out.json) and [development audit](../reports/semantic-audit-development.json).
