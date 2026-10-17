import {corpus} from '@/lib/corpus';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const event=corpus.events.find(e=>e.id===id);
  if(!event)return Response.json({error:'Unknown event'},{status:404});
  return Response.json({event,evidence:corpus.evidence.filter(e=>e.event_id===id),trials:corpus.trials.filter(t=>event.trial_ids.includes(t.id))});
}
