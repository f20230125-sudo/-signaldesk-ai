import {env} from 'cloudflare:workers';
import type {InvestigationRuntime} from './hosting-types.ts';

// Vite selects this adapter for the retained Sites/Cloudflare deployment.
export function hosting():InvestigationRuntime{
  return {env,quota:env.DB,clientIp:request=>request.headers.get('cf-connecting-ip')??'unknown-shared-visitor'};
}
