import {redisQuota} from './quota-redis.ts';
import type {InvestigationRuntime} from './hosting-types.ts';

// Node/Vercel implementation; used only by the server route.
export function hosting():InvestigationRuntime{
  const env=process.env;
  return {
    env:{GEMINI_API_KEY:env.GEMINI_API_KEY,GEMINI_MODEL:env.GEMINI_MODEL,SIGNALDESK_RATE_SALT:env.SIGNALDESK_RATE_SALT,SIGNALDESK_VISITOR_REQUEST_LIMIT:env.SIGNALDESK_VISITOR_REQUEST_LIMIT,SIGNALDESK_DAILY_MODEL_CALL_LIMIT:env.SIGNALDESK_DAILY_MODEL_CALL_LIMIT},
    quota:redisQuota(env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN),
    clientIp:request=>env.VERCEL==='1'
      ? (request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for')??'unknown-shared-visitor').split(',')[0].trim()||'unknown-shared-visitor'
      : 'unknown-shared-visitor',
  };
}
