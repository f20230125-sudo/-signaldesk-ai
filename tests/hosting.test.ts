import test from 'node:test';
import assert from 'node:assert/strict';
import {redisQuota,RESERVE_LUA} from '../lib/quota-redis.ts';
import {QuotaError,reserve,visitorKey} from '../lib/quota.ts';
import {hosting} from '../lib/hosting.ts';
import {handleInvestigation} from '../lib/investigation-endpoint.ts';
import type {InvestigationRuntime} from '../lib/hosting-types.ts';

const expiry=()=>Math.floor(Date.now()/1000)+172800;
const url='https://isolated-fixture.upstash.io';
test('Redis reservation uses one authenticated atomic EVAL without caching',async()=>{
  let observed=false;
  const fetcher:typeof fetch=async(input,init)=>{
    assert.equal(String(input),url+'/');assert.equal(new Headers(init?.headers).get('authorization'),'Bearer test-only-token');
    assert.equal(init?.cache,'no-store');assert(init?.signal instanceof AbortSignal);
    const command=JSON.parse(String(init?.body));assert.deepEqual(command.slice(0,5),['EVAL',RESERVE_LUA,1,'signaldesk:v1:model:2026-10-17',2]);
    observed=true;return Response.json({result:1});
  };
  await reserve(redisQuota(url,'test-only-token',fetcher),'model:2026-10-17',2,expiry());assert(observed);
});
test('Redis exhaustion returns the same quota error as D1',async()=>{
  const store=redisQuota(url,'test-only-token',async()=>Response.json({result:0}));
  await assert.rejects(reserve(store,'x',2,expiry()),QuotaError);
});
test('Absent credentials, failed storage and malformed replies all fail closed',async()=>{
  assert.equal(redisQuota(undefined,'token'),undefined);assert.equal(redisQuota(url,undefined),undefined);
  for(const response of [new Response('private-provider-details',{status:500}),Response.json({error:'private-provider-details'}),Response.json({result:null}),Response.json({result:'1'}),Response.json({result:-1}),Response.json({result:5})]){
    const store=redisQuota(url,'test-only-token',async()=>response);
    await assert.rejects(reserve(store,'x',2,expiry()),error=>error instanceof Error&&error.message.includes('paused')&&!error.message.includes('private-provider-details'));
  }
  await assert.rejects(reserve(redisQuota(url,'token',async()=>{throw new Error('private-provider-details');}),'x',2,expiry()),/paused/);
  assert.throws(()=>redisQuota('http://insecure.invalid','token'),/paused/);
});
test('Runtime selects Vercel visitor header and ignores spoofed Cloudflare headers',()=>{
  const old=process.env.VERCEL;
  try{
    process.env.VERCEL='1';
    const request=new Request('https://signaldesk.example/api/investigate',{headers:{'x-vercel-forwarded-for':'192.0.2.10','x-forwarded-for':'192.0.2.20','cf-connecting-ip':'192.0.2.30'}});
    assert.equal(hosting().clientIp(request),'192.0.2.10');
    delete process.env.VERCEL;assert.equal(hosting().clientIp(request),'unknown-shared-visitor');
  }finally{if(old===undefined)delete process.env.VERCEL;else process.env.VERCEL=old;}
});
const request=(body:unknown,headers:Record<string,string>={})=>new Request('https://signaldesk.example/api/investigate',{method:'POST',body:JSON.stringify(body),headers:{'content-type':'application/json',...headers}});
const runtime:InvestigationRuntime={env:{GEMINI_API_KEY:'test-only-key',SIGNALDESK_RATE_SALT:'test-only-salt'},clientIp:()=> '192.0.2.1'};
test('Portable endpoint keeps origin, payload and filter validation before model usage',async()=>{
  assert.equal((await handleInvestigation(request({question:'Review Imfinzi approvals'},{origin:'https://other.example'}),runtime)).status,403);
  assert.equal((await handleInvestigation(request({question:'x'.repeat(9000)}),runtime)).status,413);
  assert.equal((await handleInvestigation(request({question:'Review Imfinzi approvals',filters:{products:['unknown']}}),runtime)).status,400);
});
test('Missing persistent quota prevents any model request',async()=>{
  const response=await handleInvestigation(request({question:'Review Imfinzi approvals'}),runtime);
  assert.equal(response.status,503);assert.match((await response.json()).error,/Persistent request allowance/);assert.equal(response.headers.get('cache-control'),'no-store');
});
test('Visitor quota is HMAC-hashed and exhaustion prevents model usage',async()=>{
  let observed='';
  const response=await handleInvestigation(request({question:'Review Imfinzi approvals'}),{...runtime,quota:{reserve:async(key)=>{observed=key;throw new QuotaError('Daily allowance exhausted');}}});
  assert.equal(response.status,429);assert(observed.endsWith(await visitorKey('192.0.2.1','test-only-salt')));assert(!observed.includes('192.0.2.1'));
});
