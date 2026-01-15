import {corpus} from '@/lib/corpus';
import {findEvents} from '@/lib/tools';
export async function GET(request:Request){
  try{const p=new URL(request.url).searchParams;
    if([...p.keys()].some(k=>!['products','start','end','condition'].includes(k)))return Response.json({error:'Unknown filter'},{status:400});
    const filters={...(p.has('products')?{products:p.get('products')!.split(',')}:{}),...(p.has('start')?{start:p.get('start')!}:{}),...(p.has('end')?{end:p.get('end')!}:{}),...(p.has('condition')?{condition:p.get('condition')!}:{})};
    return Response.json({events:findEvents(corpus,filters),cutoff:corpus.cutoff,mode:corpus.mode,notice:corpus.collection_notice});
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid filters'},{status:400});}
}
