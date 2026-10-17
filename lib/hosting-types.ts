import type {QuotaStore} from './quota.ts';

export interface InvestigationRuntime {
  env:{
    GEMINI_API_KEY?:string;
    GEMINI_MODEL?:string;
    SIGNALDESK_RATE_SALT?:string;
    SIGNALDESK_VISITOR_REQUEST_LIMIT?:string;
    SIGNALDESK_DAILY_MODEL_CALL_LIMIT?:string;
  };
  quota?:QuotaStore;
  clientIp:(request:Request)=>string;
}
