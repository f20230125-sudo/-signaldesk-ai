import type {Corpus,Event,Filters,ToolCall,Product} from './types.ts';

export class InputError extends Error {}
const iso=/^\d{4}-\d{2}-\d{2}$/;
export function dateValid(value:string){return iso.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function validateFilters(raw:unknown,corpus:Corpus):Filters{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Filters must be an object');
  const f=raw as Record<string,unknown>;if(Object.keys(f).some(k=>!['products','start','end','condition'].includes(k)))throw new InputError('Unknown filter');
  if(f.products!==undefined&&(!Array.isArray(f.products)||f.products.length>8||f.products.some(p=>typeof p!=='string'||!corpus.products.some(x=>x.id===p))))throw new InputError('Unknown product filter');
  for(const k of ['start','end'])if(f[k]!==undefined&&(typeof f[k]!=='string'||!dateValid(f[k] as string)))throw new InputError('Use a valid YYYY-MM-DD date');
  if(f.start&&f.end&&(f.start as string)>(f.end as string))throw new InputError('Start must not follow end');
  if(f.condition!==undefined&&(typeof f.condition!=='string'||f.condition.length>120))throw new InputError('Invalid condition');
  return f as Filters;
}
export function findEvents(corpus:Corpus,filters:Filters):Event[]{
  const f=validateFilters(filters,corpus);return corpus.events.filter(e=>(!f.products?.length||e.product_ids.some(p=>f.products!.includes(p)))&&(!f.start||e.approval_date>=f.start)&&(!f.end||e.approval_date<=f.end)&&(!f.condition||`${e.title} ${e.population_summary}`.toLowerCase().includes(f.condition.toLowerCase()))).sort((a,b)=>b.approval_date.localeCompare(a.approval_date));
}
export function resolveProduct(corpus:Corpus,query:string):{matches:Product[];ambiguous:boolean}{
  const q=query.trim().toLowerCase();if(!q||q.length>120)throw new InputError('Provide a product name');
  const exact=corpus.products.filter(p=>[p.id,p.name].some(n=>n.toLowerCase()===q));
  const matches=exact.length?exact:corpus.products.filter(p=>`${p.name} ${p.ingredient} ${p.id}`.toLowerCase().includes(q));
  return {matches,ambiguous:matches.length>1};
}
function strings(value:unknown,max=12):string[]{if(!Array.isArray(value)||value.length<1||value.length>max||value.some(v=>typeof v!=='string'||v.length>160))throw new InputError('Expected a bounded list of IDs');return value as string[];}
function shape(args:Record<string,unknown>,keys:string[]){if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).some(k=>!keys.includes(k)))throw new InputError('Unexpected tool argument');}
export function executeTool(corpus:Corpus,call:ToolCall):unknown{
  const a=call.arguments;
  switch(call.name){
    case 'resolve_product':shape(a,['query']);if(typeof a.query!=='string')throw new InputError('query required');return resolveProduct(corpus,a.query);
    case 'find_events':return {events:findEvents(corpus,a),collection_notice:corpus.collection_notice};
    case 'read_evidence':{shape(a,['event_ids']);const ids=strings(a.event_ids);if(ids.some(id=>!corpus.events.some(e=>e.id===id)))throw new InputError('Unknown event');return {passages:corpus.evidence.filter(p=>ids.includes(p.event_id))};}
    case 'get_trial':{shape(a,['trial_ids']);const ids=strings(a.trial_ids);if(ids.some(id=>!/^NCT\d{8}$/.test(id)))throw new InputError('Invalid NCT identifier');return {trials:ids.map(id=>corpus.trials.find(t=>t.id===id)??{id,available:false,reason:'Not in the pinned corpus'})};}
    case 'compare_events':{shape(a,['event_ids']);const ids=strings(a.event_ids,6);if(ids.some(id=>!corpus.events.some(e=>e.id===id)))throw new InputError('Unknown event');return {events:corpus.events.filter(e=>ids.includes(e.id)),comparison_notice:'Separate trials do not establish a head-to-head treatment comparison. Approval population and trial enrollment population may differ.'};}
    default:throw new InputError('Unsupported tool');
  }
}

export const TOOL_SCHEMA=[
 {name:'resolve_product',description:'Resolve a brand or ingredient. Distinct formulations remain separate; ask when ambiguous.',parameters:{type:'OBJECT',properties:{query:{type:'STRING'}},required:['query']}},
 {name:'find_events',description:'Find FDA events in the selected, incomplete announcement corpus. Date filters use FDA approval date, never registry snapshot date.',parameters:{type:'OBJECT',properties:{products:{type:'ARRAY',items:{type:'STRING'}},start:{type:'STRING'},end:{type:'STRING'},condition:{type:'STRING'}}}},
 {name:'read_evidence',description:'Read source passages for known event IDs. is_original_excerpt=false means a browser-reviewed paraphrase, not a quotation.',parameters:{type:'OBJECT',properties:{event_ids:{type:'ARRAY',items:{type:'STRING'}}},required:['event_ids']}},
 {name:'get_trial',description:'Get current acquired trial snapshots by NCT ID. An unavailable snapshot is not evidence of absence or historical status.',parameters:{type:'OBJECT',properties:{trial_ids:{type:'ARRAY',items:{type:'STRING'}}},required:['trial_ids']}},
 {name:'compare_events',description:'Compare selected event fields without inferring clinical superiority between separate trials.',parameters:{type:'OBJECT',properties:{event_ids:{type:'ARRAY',items:{type:'STRING'}}},required:['event_ids']}}
];
