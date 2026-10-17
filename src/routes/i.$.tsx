import { publicCorsHeaders } from "@/lib/cors";
import { getDb } from "@/lib/db";
import { imageKeyRange, parseImageKey } from "@/lib/image-key";
import { buildPublicImageUrl } from "@/lib/url";
import { findImageKeyInRange } from "@/server/og";
import { createFileRoute } from "@tanstack/react-router";
import { env, waitUntil } from "cloudflare:workers";

const IMMUTABLE = "public, max-age=31536000, immutable";
const NO_STORE = "private, no-store";
const CACHE_NAME = "mosaic:images";

/**
 * Serves OG images from R2 at `/i/<r2key>`. R2 keys contain slashes
 * (`global/<hash>-<version>.jpeg`), so this is a splat route.
 *
 * Versioned keys never change content (see `src/lib/image-key.ts`), so their
 * responses are immutable and kept in the colo's Cache API. A key that has
 * been replaced by a newer screenshot redirects to the current one, so URLs
 * copied before a refresh keep working.
 */
async function serveImage(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const raw = url.pathname.replace(/^\/+i\/+/, "");
  let key = raw;
  try {
    key = decodeURIComponent(raw);
  } catch {
    // Keep the raw key when it is not validly encoded.
  }

  const isHead = request.method === "HEAD";
  const parsed = parseImageKey(key);
  // Query strings don't change the image, so they don't split the cache.
  const cacheKey = new Request(new URL(url.pathname, url.origin));
  if (parsed?.immutable && !isHead) {
    const cached = await (await caches.open(CACHE_NAME)).match(cacheKey);
    // Cached responses have immutable headers; middleware adds to them.
    if (cached) return new Response(cached.body, cached);
  }

  const object: R2Object | R2ObjectBody | null = !key
    ? null
    : isHead
      ? await env.OG_BUCKET.head(key)
      : await env.OG_BUCKET.get(key);
  if (!object) {
    const currentKey = parsed
      ? await findImageKeyInRange(
          getDb().withSession("first-unconstrained"),
          imageKeyRange(parsed.pageHash),
        )
      : null;
    if (currentKey && currentKey !== key) {
      return new Response(null, {
        status: 307,
        headers: {
          ...publicCorsHeaders,
          Location: buildPublicImageUrl(
            currentKey,
            new URL("/i/", url).toString(),
          ),
          "Cache-Control": NO_STORE,
        },
      });
    }
    return new Response("Not found", {
      status: 404,
      headers: { ...publicCorsHeaders, "Cache-Control": "no-store" },
    });
  }

  const headers = new Headers(publicCorsHeaders);
  object.writeHttpMetadata(headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "image/jpeg");
  headers.set("Cache-Control", parsed?.immutable ? IMMUTABLE : NO_STORE);
  headers.set("ETag", object.httpEtag);

  const body = isHead ? null : (object as R2ObjectBody).body;
  const response = new Response(body, { status: 200, headers });
  if (parsed?.immutable && !isHead) {
    const copy = response.clone();
    waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.put(cacheKey, copy))
        .catch((error: unknown) => {
          console.error("[IMAGE] Failed to cache image:", error);
        }),
    );
  }
  return response;
}

export const Route = createFileRoute("/i/$")({
  server: {
    handlers: {
      GET: ({ request }) => serveImage(request),
      HEAD: ({ request }) => serveImage(request),
      OPTIONS: () =>
        new Response(null, { status: 204, headers: publicCorsHeaders }),
    },
  },
});
