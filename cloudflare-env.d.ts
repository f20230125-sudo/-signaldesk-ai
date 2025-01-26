declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    SIGNALDESK_RATE_SALT?: string;
    SIGNALDESK_DAILY_MODEL_CALL_LIMIT?: string;
    SIGNALDESK_VISITOR_REQUEST_LIMIT?: string;
  }
}
