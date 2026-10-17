import {QuotaError} from './quota.ts';

// Check, increment and expiry happen atomically across serverless instances.
export const RESERVE_LUA=`
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if count >= tonumber(ARGV[1]) then return 0 end
local next = redis.call('INCR', KEYS[1])
redis.call('EXPIREAT', KEYS[1], tonumber(ARGV[2]))
return next
`;
const unavailable='Persistent request allowance is unavailable; live investigations are paused.';

export function redisQuota(url:string|undefined,token:string|undefined,fetcher:typeof fetch=fetch){
  if(!url||!token)return undefined;
  let endpoint:URL;
  try{endpoint=new URL(url);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw new Error();}
  catch{throw new Error(unavailable);}
  return {async reserve(key:string,limit:number,expires:number){
    if(!Number.isSafeInteger(limit)||limit<1||!Number.isSafeInteger(expires)||expires<=Math.floor(Date.now()/1000))throw new Error(unavailable);
    let result:unknown;
    try{
      const response=await fetcher(endpoint,{
        method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},
        body:JSON.stringify(['EVAL',RESERVE_LUA,1,`signaldesk:v1:${key}`,limit,expires]),
        cache:'no-store',signal:AbortSignal.timeout(8000),
      });
      if(!response.ok)throw new Error();
      const body=await response.json() as {result?:unknown;error?:unknown};
      if(!body||body.error!==undefined)throw new Error();
      result=body.result;
      if(typeof result!=='number'||!Number.isSafeInteger(result)||result<0||result>limit)throw new Error();
    }catch{throw new Error(unavailable);}
    if(result===0)throw new QuotaError('The free investigation allowance is currently exhausted. Please try again after the daily reset.');
  }};
}
