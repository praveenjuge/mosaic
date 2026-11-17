import { waitUntil } from "cloudflare:workers";

/**
 * Store `response` in this colo's Cache API after the current response, so
 * a write never delays it. A failed write only costs a later cache miss.
 */
export function cacheAfterResponse(
  cacheName: string,
  key: Request,
  response: Response,
): void {
  waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.put(key, response))
      .catch((error: unknown) => {
        console.error(`[CACHE] Failed to write to ${cacheName}:`, error);
      }),
  );
}
