/**
 * Deny marker assigned to Mosaic's own Cloudflare Browser Run session.
 *
 * If a captured page redirects back to `/use`, Chromium preserves this user
 * agent and the request is stopped before another screenshot can be started.
 * This is intentionally a deny-only marker: spoofing it cannot grant access.
 */
export const MOSAIC_RENDERER_USER_AGENT = "MosaicBrowserRun/1.0";

export function isMosaicRendererRequest(request: Request): boolean {
  return (
    request.headers.get("User-Agent")?.includes(MOSAIC_RENDERER_USER_AGENT) ??
    false
  );
}
