export type QuotaDb={prepare:(sql:string)=>{bind:(...values:unknown[])=>{first:<T>()=>Promise<T|null>}}};
export type QuotaStore=QuotaDb|{reserve:(key:string,limit:number,expires:number)=>Promise<void>};
export class QuotaError extends Error {status=429;}
export const QUOTA_SQL='INSERT INTO quotas (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count';
export function boundedLimit(value:string|undefined,fallback:number,ceiling:number){const n=Number(value);return value&&Number.isSafeInteger(n)&&n>0?Math.min(n,ceiling):fallback;}
export async function reserve(db:QuotaStore|undefined,key:string,limit:number,expires:number){
  if(!db)throw new Error('Persistent request allowance is unavailable; live investigations are paused.');
  if('reserve' in db)return db.reserve(key,limit,expires);
  const row=await db.prepare(QUOTA_SQL).bind(key,expires,limit).first<{count:number}>();
  if(!row)throw new QuotaError('The free investigation allowance is currently exhausted. Please try again after the daily reset.');
}
export async function visitorKey(ip:string,salt:string){
  if(!salt)throw new Error('Request protection is not configured.');
  const encoder=new TextEncoder();const key=await crypto.subtle.importKey('raw',encoder.encode(salt),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const hash=await crypto.subtle.sign('HMAC',key,encoder.encode(ip));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
