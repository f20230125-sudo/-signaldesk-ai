import {corpus} from './corpus.ts';
import {investigate} from './agent.ts';
import {geminiModel,ProviderError} from './model.ts';
import {validateFilters,InputError} from './tools.ts';
import {boundedLimit,reserve,visitorKey,QuotaError} from './quota.ts';
import type {InvestigationRuntime} from './hosting-types.ts';
import {readBoundedJson,RequestBodyError} from './request-body.ts';
export async function handleInvestigation(request:Request,runtime:InvestigationRuntime){
  const {env,quota}=runtime;
  try{
    const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Origin not allowed'},{status:403});
    const body=await readBoundedJson(request,8192) as Record<string,unknown>;
    if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['question','filters'].includes(k)))throw new InputError('Unexpected request fields');
    if(typeof body.question!=='string'||body.question.trim().length<8||body.question.length>1600)throw new InputError('Question must contain 8–1600 characters');
    const filters=validateFilters(body.filters??{},corpus);
    const model=geminiModel(env.GEMINI_API_KEY??'',env.GEMINI_MODEL??'gemini-3.5-flash-lite');
    const now=new Date(),day=now.toISOString().slice(0,10),expires=Math.floor(now.getTime()/1000)+172800;
    const ip=runtime.clientIp(request);
    const visitor=await visitorKey(ip,env.SIGNALDESK_RATE_SALT??'');
    await reserve(quota,`request:${day}:${visitor}`,boundedLimit(env.SIGNALDESK_VISITOR_REQUEST_LIMIT,5,20),expires);
    const result=await investigate(corpus,body.question,filters,model,{signal:request.signal,beforeCall:()=>reserve(quota,`model:${day}`,boundedLimit(env.SIGNALDESK_DAILY_MODEL_CALL_LIMIT,120,120),expires)});
    return Response.json(result,{status:result.status==='unavailable'?503:200,headers:{'cache-control':'no-store'}});
  }catch(e){const status=e instanceof RequestBodyError?e.status:e instanceof InputError?400:e instanceof QuotaError?429:e instanceof ProviderError?e.status:503;
    return Response.json({status:'unavailable',error:e instanceof Error?e.message:'Live investigations are currently unavailable.'},{status,headers:{'cache-control':'no-store'}});
  }
}
