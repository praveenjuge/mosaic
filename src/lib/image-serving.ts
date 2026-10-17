/**
 * Serves OG images from R2 at `/i/<r2key>`. R2 keys contain slashes
 * (`global/<hash>-<version>.jpeg`), so the key is the rest of the path.
 *
 * Versioned keys never change content (see `src/lib/image-key.ts`), so their
 * responses are immutable and kept in the colo's Cache API. A key that has
 * been replaced by a newer screenshot redirects to the current one, so URLs
 * copied before a refresh keep working.
 */

import { publicCorsHeaders } from "@/lib/cors";
import { getDb } from "@/lib/db";
import { imageKeyRange, parseImageKey } from "@/lib/image-key";
import { buildPublicImageUrl } from "@/lib/url";
import { findImageKeyInRange } from "@/server/og";
import { env, waitUntil } from "cloudflare:workers";

const IMMUTABLE = "public, max-age=31536000, immutable";
const NO_STORE = "private, no-store";
const CACHE_NAME = "mosaic:images";

/**
 * Put a just-stored image in this colo's image cache, so the redirect that
 * follows a generation doesn't have to read it back from R2. `imageUrl` is
 * the `/i/<key>` URL the redirect points at.
 */
export function cacheGeneratedImage(
  imageUrl: string,
  image: ArrayBuffer,
  etag: string,
): void {
  const url = new URL(imageUrl);
  // The same headers `serveImage` sends for an object Mosaic stored.
  const response = new Response(image, {
    headers: {
      ...publicCorsHeaders,
      "Content-Type": "image/jpeg",
      "Cache-Control": IMMUTABLE,
      ETag: etag,
    },
  });
  waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.put(new Request(new URL(url.pathname, url.origin)), response),
      )
      .catch((error: unknown) => {
        console.error("[IMAGE] Failed to cache generated image:", error);
      }),
  );
}

export async function serveImage(request: Request): Promise<Response> {
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
  // HEAD reads the same cached copy as GET, so both describe one image.
  if (parsed?.immutable) {
    const cached = await (await caches.open(CACHE_NAME)).match(cacheKey);
    // Cached responses have immutable headers; the server entry adds to them.
    if (cached) return new Response(isHead ? null : cached.body, cached);
  }

  const object: R2Object | R2ObjectBody | null = !key
    ? null
    : isHead
      ? await env.OG_BUCKET.head(key)
      : await env.OG_BUCKET.get(key);
  if (!object) {
    const currentKey = parsed
      ? await findImageKeyInRange(
          // The primary: a lagging replica could still name the key that
          // was just deleted, and misses are rare.
          getDb().withSession("first-primary"),
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
