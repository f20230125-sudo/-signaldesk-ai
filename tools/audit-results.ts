/** Attach recorded source-support reviews without making new inference calls. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {scoreTask,wilson} from '../lib/scoring.ts';
import type {Task} from '../lib/scoring.ts';
import type {Investigation} from '../lib/types.ts';

const development=process.argv.includes('--dev');
const split=development?'dev':'test';
const reportPath=development?'reports/development-evaluation.json':'data/evaluation/report.json';
const auditPath=development?'reports/semantic-audit-development.json':'reports/semantic-audit-held-out.json';
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
const tasks=(JSON.parse(fs.readFileSync('data/evaluation/tasks.json','utf8')).tasks as Task[]).filter(task=>task.split===split);
const hash=createHash('sha256');
for(const file of ['data/corpus.json','data/evaluation/tasks.json','data/evaluation/source-protocol.json','lib/source-status.ts','lib/agent.ts','lib/model.ts','lib/tools.ts','lib/retrieval.ts','lib/scoring.ts'])hash.update(fs.readFileSync(file));
hash.update(report.model);hash.update(split);
if(hash.digest('hex')!==report.fingerprint||audit.fingerprint!==report.fingerprint)throw new Error('Audit, current source and model response fingerprints must match');
const expected=new Set(tasks.flatMap(task=>['agent','baseline'].map(mode=>task.id+'-'+mode)));
if(report.cases.length!==expected.size||Object.keys(audit.decisions).length!==expected.size)throw new Error('Every paired case requires one recorded review');
const seen=new Set<string>();
for(const row of report.cases as {task_id:string;mode:string;fingerprint:string;completed:boolean;result:Investigation;score:Omit<ReturnType<typeof scoreTask>,'strict_pass'>&{strict_pass:boolean|null};semantic_audit?:unknown}[]){
 const key=row.task_id+'-'+row.mode;
 if(!expected.has(key)||seen.has(key)||row.fingerprint!==report.fingerprint||!row.completed)throw new Error('Incomplete, duplicate or unexpected case: '+key);
 seen.add(key);
 const decision=audit.decisions[key];
 if(typeof decision?.semantic_pass!=='boolean'||typeof decision.reviewer!=='string'||!decision.reviewer.trim()||typeof decision.notes!=='string'||!decision.notes.trim())throw new Error('Missing semantic decision: '+key);
 const score=scoreTask(tasks.find(task=>task.id===row.task_id)!,row.result);
 row.score={...score,strict_pass:score.automatic_pass&&decision.semantic_pass};
 row.semantic_audit=decision;
}
for(const mode of ['agent','baseline']){
 const rows=report.cases.filter((row:{mode:string})=>row.mode===mode);
 const success=rows.filter((row:{score:{strict_pass:boolean}})=>row.score.strict_pass).length;
 report[mode+'_success_rate']=success/rows.length;
 report[mode+'_wilson_95']=wilson(success,rows.length);
}
report.status='complete';
report.semantic_audit={path:auditPath,reviewed_at:audit.reviewed_at,review_protocol:audit.review_protocol,independent_clinical_adjudication:false};
report.summary='Full paired run completed with recorded developer semantic source-support review. This authored portfolio task set has no independent clinical adjudication; its scores do not establish general clinical accuracy.';
fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
console.log(JSON.stringify({split,status:report.status,agent:report.agent_success_rate,baseline:report.baseline_success_rate,paired_tasks:tasks.length}));
