/**
 * Deny marker assigned to Mosaic's own Cloudflare Browser Run session.
 *
 * If a captured page redirects back to `/use`, Chromium preserves this user
 * agent and the request is stopped before another screenshot can be started.
 * This is intentionally a deny-only marker: spoofing it cannot grant access.
 */
export const MOSAIC_RENDERER_MARKER = "MosaicBrowserRun/1.0";
export const MOSAIC_RENDERER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  `Chrome/152.0.0.0 Safari/537.36 ${MOSAIC_RENDERER_MARKER}`;

export function isMosaicRendererRequest(request: Request): boolean {
  return (
    request.headers.get("User-Agent")?.includes(MOSAIC_RENDERER_MARKER) ?? false
  );
}
