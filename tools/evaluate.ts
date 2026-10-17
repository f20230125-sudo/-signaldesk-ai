import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {investigate} from '../lib/agent.ts';
import {geminiModel} from '../lib/model.ts';
import {scoreTask,wilson} from '../lib/scoring.ts';
import type {Task} from '../lib/scoring.ts';
import type {Corpus,Investigation} from '../lib/types.ts';

const root=process.cwd();
if(process.env.SIGNALDESK_LIVE_EVAL!=='1')throw new Error('Live evaluation is opt-in. Set SIGNALDESK_LIVE_EVAL=1 and provide the free-tier API key through secure environment settings.');
const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('GEMINI_API_KEY is not configured.');
const args=process.argv.slice(2);const split=args.includes('--dev')?'dev':'test';
const corpus=JSON.parse(fs.readFileSync(path.join(root,'data/corpus.json'),'utf8')) as Corpus;
if(corpus.mode!=='original-sources'&&!args.includes('--allow-seed'))throw new Error('Original acquisition must complete before the final benchmark. --allow-seed is for separately labelled development runs only.');
if(split==='test'&&corpus.mode!=='original-sources')throw new Error('The held-out benchmark requires original verified sources.');
const tasks=(JSON.parse(fs.readFileSync(path.join(root,'data/evaluation/tasks.json'),'utf8')).tasks as Task[]).filter(t=>t.split===split);
const model=geminiModel(key,process.env.GEMINI_MODEL??'gemini-2.5-flash-lite');
const hash=createHash('sha256');for(const p of ['data/corpus.json','data/evaluation/tasks.json','lib/agent.ts','lib/model.ts','lib/tools.ts','lib/retrieval.ts','lib/scoring.ts'])hash.update(fs.readFileSync(path.join(root,p)));
hash.update(model.name);hash.update(split);const fingerprint=hash.digest('hex');
const dir=path.join(root,'reports/runs',fingerprint);fs.mkdirSync(dir,{recursive:true});
const auditPath=path.join(dir,'manual-audit.json');
const audit=fs.existsSync(auditPath)?JSON.parse(fs.readFileSync(auditPath,'utf8')):{};
let stopped=false;
let lastCallAt=0;
const callInterval=Number(process.env.SIGNALDESK_EVAL_CALL_INTERVAL_MS??6000);
if(!Number.isFinite(callInterval)||callInterval<0||callInterval>15000)throw new Error('Evaluation call interval must be between zero and fifteen thousand milliseconds.');
for(const task of tasks){for(const mode of ['baseline','agent'] as const){
 const file=path.join(dir,`${task.id}-${mode}.json`);if(fs.existsSync(file)&&JSON.parse(fs.readFileSync(file,'utf8')).completed)continue;
 const result=await investigate(corpus,task.question,task.filters,model,{mode,beforeCall:async()=>{const delay=callInterval-(Date.now()-lastCallAt);if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));lastCallAt=Date.now();}});
 const interrupted=result.status==='unavailable'&&/allowance|quota|rate limit/i.test(result.error??'');
 const row={task_id:task.id,category:task.category,mode,fingerprint,completed:!interrupted,result,score:scoreTask(task,result)};
 fs.writeFileSync(file,JSON.stringify(row,null,2));console.log(task.id,mode,result.status,interrupted?'quota interrupted':'recorded');
 if(interrupted){stopped=true;break;}
 await new Promise(resolve=>setTimeout(resolve,5000));
}if(stopped)break;}
const cases=fs.readdirSync(dir).filter(p=>p.endsWith('.json')&&p!=='manual-audit.json').map(p=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8')));
for(const row of cases){const decision=audit[`${row.task_id}-${row.mode}`];const reviewed=typeof decision?.semantic_pass==='boolean'&&typeof decision.reviewer==='string'&&decision.reviewer.trim()&&typeof decision.notes==='string'&&decision.notes.trim();row.score.strict_pass=row.completed&&reviewed?row.score.automatic_pass&&decision.semantic_pass:null;}
const completed=(mode:string)=>cases.filter(c=>c.mode===mode&&c.completed);
const manuallyScored=cases.every(c=>!c.completed||c.score.strict_pass!==null);
const complete=completed('agent').length===tasks.length&&completed('baseline').length===tasks.length;
const report={status:complete&&manuallyScored?'complete':cases.length?'partial':'not_run',development_tasks:20,held_out_tasks:40,split,corpus_mode:corpus.mode,acquired_sources:corpus.acquisition,completed_agent_tasks:completed('agent').length,completed_baseline_tasks:completed('baseline').length,model:model.name,fingerprint,
 summary:complete&&manuallyScored?'Full paired run completed and developer semantic audit recorded.':'Evaluation is partial until both systems complete every task and each answer receives a recorded semantic audit. Automatic field checks are not general answer accuracy.',cases,
 ...(complete&&manuallyScored?Object.fromEntries(['agent','baseline'].flatMap(mode=>{const rows=completed(mode),success=rows.filter(r=>r.score.strict_pass).length;return [[`${mode}_success_rate`,success/rows.length],[`${mode}_wilson_95`,wilson(success,rows.length)]];})):{})};
const dest=split==='test'?path.join(root,'data/evaluation/report.json'):path.join(dir,'development-report.json');fs.writeFileSync(dest,JSON.stringify(report,null,2));
if(split==='dev')fs.writeFileSync(path.join(root,'reports/development-evaluation.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.status,agent:report.completed_agent_tasks,baseline:report.completed_baseline_tasks,manual_audit_required:!manuallyScored}));
