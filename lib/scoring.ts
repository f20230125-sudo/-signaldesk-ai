import type {Investigation} from './types.ts';
export type Task={id:string;split:string;category:string;question:string;filters:Record<string,unknown>;event_group:string|null;expected:{event_ids:string[];product_ids:string[];trial_ids:string[];requires_limitations:boolean;manual_review_required:boolean}};
const same=(a:string[],b:string[])=>a.length===new Set(a).size&&a.length===b.length&&a.every(x=>b.includes(x));
export function scoreTask(task:Task,result:Investigation){
 const events=same(result.event_ids,task.expected.event_ids);
 const products=task.expected.product_ids.every(p=>result.product_ids.includes(p)||result.facts.some(e=>e.product_ids.includes(p)))&&result.product_ids.every(p=>task.expected.product_ids.includes(p));
 const trials=task.expected.trial_ids.length?same(result.trial_ids,task.expected.trial_ids):true;
 const limitations=!task.expected.requires_limitations||result.limitations.length>0;
 const evidence=result.facts.every(e=>result.evidence.some(p=>p.event_id===e.id));
 const available=result.status!=='unavailable';
 return {automatic_pass:events&&products&&trials&&limitations&&evidence&&available,event_selection:events,product_identity:products,trial_links:trials,limitation_present:limitations,evidence_coverage:evidence,manual_review_required:true,strict_pass:null};
}
export function wilson(success:number,total:number){if(!total)return null;const z=1.96,p=success/total,d=1+z*z/total,c=(p+z*z/(2*total))/d,w=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;return [Math.max(0,c-w),Math.min(1,c+w)];}
