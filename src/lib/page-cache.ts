/**
 * Rules for caching signed-out page HTML in the Cache API (`src/start.ts`).
 *
 * Content pages render the same HTML for every signed-out visitor, so the
 * Worker can skip rendering them. A request is only served from the cache
 * when it carries no sign of a Clerk session; anything that might be signed
 * in renders fresh, so per-user HTML is never stored or shared.
 */

/** `/`, `/legal`, `/help`, and help articles and guides. */
const CACHEABLE_PATH = /^\/(?:legal|help(?:\/guides)?(?:\/[a-z0-9-]+)?)?$/;

/** Clerk cookies that mean a session exists or may need a handshake. */
function hasClerkSession(cookieHeader: string | null): boolean {
  for (const part of (cookieHeader ?? "").split(";")) {
    const separator = part.indexOf("=");
    const name = (separator === -1 ? part : part.slice(0, separator)).trim();
    const value = separator === -1 ? "" : part.slice(separator + 1).trim();
    if (name.startsWith("__session") || name.startsWith("__clerk")) {
      return true;
    }
    // `__client_uat` is "0" once signed out; anything else means signed in
    // on another tab or domain, which Clerk resolves with a handshake.
    if (name.startsWith("__client_uat") && value !== "0") return true;
  }
  return false;
}

/**
 * Whether `request` may be answered from, and stored in, the page cache.
 * Only production Clerk instances: development instances redirect every
 * signed-out request through a handshake that must not be skipped.
 */
export function isCacheablePageRequest(
  request: Request,
  clerkPublishableKey: string,
): boolean {
  if (request.method !== "GET") return false;
  if (!clerkPublishableKey.startsWith("pk_live_")) return false;
  const url = new URL(request.url);
  if (url.search || !CACHEABLE_PATH.test(url.pathname)) return false;
  if (request.headers.has("Authorization")) return false;
  return !hasClerkSession(request.headers.get("Cookie"));
}

/** Whether a rendered page response is the same for everyone. */
export function isCacheablePageResponse(response: Response): boolean {
  return (
    response.status === 200 &&
    !response.headers.has("Set-Cookie") &&
    (response.headers.get("Content-Type") ?? "").startsWith("text/html")
  );
}

/**
 * Cache key for a page. The build ID keeps HTML from an earlier deploy,
 * which points at that deploy's asset files, from being served after it.
 */
export function pageCacheKey(request: Request, buildId: string): Request {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}?build=${buildId}`);
}
