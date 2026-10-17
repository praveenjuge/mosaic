/**
 * CORS for the public `/use` and `/i/*` endpoints. They take no credentials
 * and return no per-user data, so any origin may read them.
 */
export const publicCorsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
