"""Publish descriptive benchmark receipts only after complete semantic review."""
import json
import statistics
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def main():
    reports={split:json.loads((ROOT/path).read_text(encoding='utf-8')) for split,path in [('development','reports/development-evaluation.json'),('held-out','data/evaluation/report.json')]}
    if any(report['status']!='complete' or any('semantic_audit' not in row for row in report['cases']) for report in reports.values()):raise ValueError('Complete paired runs and attached semantic audits are required')
    summary={}
    for split,report in reports.items():
        systems={}
        for mode in ('agent','baseline'):
            rows=[row for row in report['cases'] if row['mode']==mode]
            systems[mode]={
                'tasks':len(rows),'strict_successes':sum(row['score']['strict_pass'] for row in rows),
                'automatic_successes':sum(row['score']['automatic_pass'] for row in rows),
                'unavailable_responses':sum(row['result']['status']=='unavailable' for row in rows),
                'wilson_95':report[mode+'_wilson_95'],
                'median_paced_latency_seconds':round(statistics.median(row['result']['usage']['latency_ms'] for row in rows)/1000,2),
                'model_calls':sum(row['result']['usage']['model_calls'] for row in rows),
                'input_tokens':sum(row['result']['usage']['input_tokens'] for row in rows),
                'output_tokens':sum(row['result']['usage']['output_tokens'] for row in rows)}
        pairs={row['task_id']:{mode:next(case for case in report['cases'] if case['task_id']==row['task_id'] and case['mode']==mode)['score']['strict_pass'] for mode in ('agent','baseline')} for row in report['cases']}
        categories={category:{mode:sum(row['score']['strict_pass'] for row in report['cases'] if row['category']==category and row['mode']==mode) for mode in ('agent','baseline')} for category in sorted({row['category'] for row in report['cases']})}
        summary[split]={'fingerprint':report['fingerprint'],'model':report['model'],'systems':systems,'category_strict_successes':categories,'paired_outcomes':{
            'both_pass':sum(pair['agent'] and pair['baseline'] for pair in pairs.values()),
            'agent_only_pass':sum(pair['agent'] and not pair['baseline'] for pair in pairs.values()),
            'baseline_only_pass':sum(not pair['agent'] and pair['baseline'] for pair in pairs.values()),
            'both_fail':sum(not pair['agent'] and not pair['baseline'] for pair in pairs.values())}}
    summary['limitations']=['Developer-authored, related portfolio tasks with Codex-assisted source-support review; no independent human or clinical adjudication.','Source verification uses selected publisher proof and developer field reviews; original FDA HTML acquisition remains incomplete.','Model call budgets differ: one baseline call versus at most four agent calls.','Reported latency includes benchmark pacing and is not production response time.','Held-out failures are retained; prompts were not tuned against this held-out run.','Local production browser QA and public deployment are separate checks.','The development set covers date/event and trial-link tasks; formulation and refusal categories are only in the held-out set.','Exact empty-selection references can fail otherwise appropriate refusals that include supported product or event cards.']
    (ROOT/'reports/benchmark-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8',newline='\n')
    lines=['# Paired benchmark results','','Strict success requires the automatic field checks **and** a recorded Codex-assisted developer semantic source-support review. The tasks and seed were frozen before evaluation. These results describe this authored task set; they do not establish clinical accuracy or commercial impact.','','| Split | System | Strict successes | 95% Wilson interval | Unavailable | Model calls | Median paced seconds |','| --- | --- | --- | --- | --- | --- | --- |']
    for split in ('development','held-out'):
        for mode,metrics in summary[split]['systems'].items():
            lo,hi=metrics['wilson_95']
            lines.append(f"| {split} | {mode} | {metrics['strict_successes']}/{metrics['tasks']} | {lo:.1%}–{hi:.1%} | {metrics['unavailable_responses']} | {metrics['model_calls']} | {metrics['median_paced_latency_seconds']} |")
    target=summary['held-out']['systems']['agent']['strict_successes']
    lines+=['',f'The prespecified agent target was 34/40 strict successes; the observed result was {target}/40. The target was '+('met.' if target>=34 else 'not met.'),'','## Held-out case results','','| Task | Category | Agent | Baseline |','| --- | --- | --- | --- |']
    test=reports['held-out']
    for task in sorted({row['task_id'] for row in test['cases']}):
        rows={row['mode']:row for row in test['cases'] if row['task_id']==task}
        lines.append('| '+task+' | '+rows['agent']['category']+' | '+' | '.join('pass' if rows[mode]['score']['strict_pass'] else 'fail' for mode in ('agent','baseline'))+' |')
    lines+=['','## Failure notes','']
    for row in test['cases']:
        if not row['score']['strict_pass']:lines.append(f"- **{row['task_id']} / {row['mode']}**: {row['semantic_audit']['notes']}")
    lines+=['','## Interpretation and limits','']+['- '+limit for limit in summary['limitations']]
    lines+=['','Full outputs and per-case reviews: [held-out report](../data/evaluation/report.json), [development report](../reports/development-evaluation.json), [held-out audit](../reports/semantic-audit-held-out.json) and [development audit](../reports/semantic-audit-development.json).','']
    (ROOT/'docs/benchmark-results.md').write_text('\n'.join(lines),encoding='utf-8',newline='\n')
    print(json.dumps({split:{mode:metrics['strict_successes'] for mode,metrics in summary[split]['systems'].items()} for split in ('development','held-out')}))

if __name__=='__main__':main()
