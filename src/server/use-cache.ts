/**
 * This colo's memory of `/use` answers, so repeat crawler hits skip D1: a
 * fresh image's key per page for up to `USE_CACHE_MAX_AGE_S` (never past its
 * `expires_at`), and an unregistered hostname for
 * `UNREGISTERED_CACHE_MAX_AGE_S`. Adding a site and resetting or
 * regenerating images forget the answers they make wrong in this colo at
 * once; other colos, and deleted sites, wait out those times.
 */

import { cacheAfterResponse } from "@/server/cache";

const USE_CACHE_MAX_AGE_S = 300;
const UNREGISTERED_CACHE_MAX_AGE_S = 30;
const USE_CACHE_NAME = "mosaic:use";
/** Most page answers one reset forgets, to bound its Cache API calls. */
const FORGET_PAGES_LIMIT = 500;

function cacheKey(
  origin: string,
  kind: "page" | "hostname",
  value: string,
): Request {
  return new Request(
    `${origin}/use-cache/${kind}?value=${encodeURIComponent(value)}`,
  );
}

function remember(key: Request, body: string, maxAgeSeconds: number): void {
  if (maxAgeSeconds < 1) return;
  cacheAfterResponse(
    USE_CACHE_NAME,
    key,
    new Response(body, {
      headers: { "Cache-Control": `public, max-age=${maxAgeSeconds}` },
    }),
  );
}

type RememberedAnswer =
  { kind: "unregistered" } | { kind: "fresh"; key: string } | null;

export async function recallUseAnswer(
  origin: string,
  page: { pageUrl: string; hostname: string },
): Promise<RememberedAnswer> {
  const cache = await caches.open(USE_CACHE_NAME);
  const [fresh, unregistered] = await Promise.all([
    cache.match(cacheKey(origin, "page", page.pageUrl)),
    cache.match(cacheKey(origin, "hostname", page.hostname)),
  ]);
  if (unregistered) return { kind: "unregistered" };
  if (fresh) return { kind: "fresh", key: await fresh.text() };
  return null;
}

export function rememberUnregistered(origin: string, hostname: string): void {
  remember(
    cacheKey(origin, "hostname", hostname),
    "",
    UNREGISTERED_CACHE_MAX_AGE_S,
  );
}

export function rememberFreshImage(
  origin: string,
  pageUrl: string,
  image: { key: string; expiresAt: number },
): void {
  remember(
    cacheKey(origin, "page", pageUrl),
    image.key,
    Math.min(
      USE_CACHE_MAX_AGE_S,
      Math.floor((image.expiresAt - Date.now()) / 1000),
    ),
  );
}

export async function forgetUnregistered(
  origin: string,
  hostname: string,
): Promise<void> {
  const cache = await caches.open(USE_CACHE_NAME);
  await cache.delete(cacheKey(origin, "hostname", hostname));
}

export async function forgetPages(
  origin: string,
  pageUrls: string[],
): Promise<void> {
  const cache = await caches.open(USE_CACHE_NAME);
  await Promise.all(
    pageUrls
      .slice(0, FORGET_PAGES_LIMIT)
      .map((pageUrl) => cache.delete(cacheKey(origin, "page", pageUrl))),
  );
}
