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

/**
 * Query parameters that link trackers add and pages never read. Visitors
 * arriving from social posts, ads, and newsletters usually carry one.
 */
const TRACKING_PARAM =
  /^(?:utm_\w+|fbclid|gclid|gbraid|wbraid|msclkid|twclid|li_fat_id|igshid|mc_cid|mc_eid|ref|ref_src|_ga|_gl|si)$/;

/** Whether every query parameter is a tracking one (or there are none). */
function hasOnlyTrackingParams(url: URL): boolean {
  for (const name of url.searchParams.keys()) {
    if (!TRACKING_PARAM.test(name)) return false;
  }
  return true;
}

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
 * Whether `request` may be answered from the page cache. Tracking query
 * parameters don't change the page, so they are ignored; only a request
 * without a query stores a page (`isStorablePageRequest`). Only production
 * Clerk instances: development instances redirect every signed-out request
 * through a handshake that must not be skipped.
 */
export function isCacheablePageRequest(
  request: Request,
  clerkPublishableKey: string,
): boolean {
  if (request.method !== "GET") return false;
  if (!clerkPublishableKey.startsWith("pk_live_")) return false;
  const url = new URL(request.url);
  if (!hasOnlyTrackingParams(url) || !CACHEABLE_PATH.test(url.pathname)) {
    return false;
  }
  if (request.headers.has("Authorization")) return false;
  return !hasClerkSession(request.headers.get("Cookie"));
}

/**
 * Whether a cacheable request's rendered page may be stored: only the plain
 * URL's, so the shared copy never comes from a render that saw a query.
 */
export function isStorablePageRequest(request: Request): boolean {
  return !new URL(request.url).search;
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
