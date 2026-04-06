import type {Corpus,Evidence} from './types.ts';
const stop=new Set(['the','a','an','and','of','to','in','for','with','which','what','on','by','is','was','as','at','from','show']);
const tokens=(s:string)=>s.toLowerCase().match(/[a-z0-9]+/g)?.filter(t=>!stop.has(t))??[];
export function retrieve(corpus:Corpus,query:string,limit=12):Evidence[]{
  const events=new Map(corpus.events.map(e=>[e.id,e]));
  const products=new Map(corpus.products.map(p=>[p.id,p.name+' '+p.ingredient+' '+p.route]));
  const q=[...new Set(tokens(query))];const docs=corpus.evidence.map(e=>{const event=events.get(e.event_id);const metadata=event?[event.title,event.approval_date,...event.product_ids.map(id=>products.get(id)??id),...event.trial_names,...event.trial_ids].join(' '):'';return {e,t:tokens(e.text+' '+metadata)};});
  const avg=docs.reduce((n,d)=>n+d.t.length,0)/(docs.length||1);const df=new Map(q.map(t=>[t,docs.filter(d=>d.t.includes(t)).length]));
  return docs.map(d=>({e:d.e,score:q.reduce((s,t)=>{const tf=d.t.filter(v=>v===t).length;const idf=Math.log(1+(docs.length-(df.get(t)??0)+.5)/((df.get(t)??0)+.5));return s+idf*tf*2.2/(tf+1.2*(.25+.75*d.t.length/(avg||1)));},0)})).filter(d=>d.score>0).sort((a,b)=>b.score-a.score||a.e.id.localeCompare(b.e.id)).slice(0,limit).map(d=>d.e);
}
