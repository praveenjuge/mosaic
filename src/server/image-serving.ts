/**
 * Serves OG images from R2 at `/i/<r2key>`. R2 keys contain slashes
 * (`global/<hash>-<version>.jpeg`), so the key is the rest of the path.
 *
 * Versioned keys never change content (see `src/server/image-store.ts`), so
 * their responses are immutable and kept in the colo's Cache API. A key that
 * has been replaced by a newer screenshot redirects to the current one, so
 * URLs copied before a refresh keep working.
 */

import { publicImageUrl } from "@/lib/url";
import { cacheAfterResponse } from "@/server/cache";
import { getDb } from "@/server/db";
import {
  findImageKeyInRange,
  imageKeyRange,
  parseImageKey,
} from "@/server/image-store";
import { env } from "cloudflare:workers";

const IMMUTABLE = "public, max-age=31536000, immutable";
const NO_STORE = "private, no-store";
const CACHE_NAME = "mosaic:images";

/** Query strings don't change the image, so they don't split the cache. */
function imageCacheKey(url: URL): Request {
  return new Request(new URL(url.pathname, url.origin));
}

function imageHeaders(
  etag: string,
  immutable: boolean,
  object?: R2Object,
): Headers {
  const headers = new Headers();
  object?.writeHttpMetadata(headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "image/jpeg");
  headers.set("Cache-Control", immutable ? IMMUTABLE : NO_STORE);
  headers.set("ETag", etag);
  return headers;
}

/**
 * Put a just-stored image in this colo's image cache, so the redirect that
 * follows a generation doesn't have to read it back from R2. `origin` serves
 * the `/i/<key>` URL the redirect points at.
 */
export function cacheGeneratedImage(
  origin: string,
  key: string,
  image: ArrayBuffer,
  etag: string,
): void {
  cacheAfterResponse(
    CACHE_NAME,
    imageCacheKey(new URL(publicImageUrl(key, origin))),
    new Response(image, { headers: imageHeaders(etag, true) }),
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
  const immutable = parsed?.immutable ?? false;
  const cacheKey = imageCacheKey(url);
  // HEAD reads the same cached copy as GET, so both describe one image.
  if (immutable) {
    const cached = await (await caches.open(CACHE_NAME)).match(cacheKey);
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
          Location: publicImageUrl(currentKey, url.origin),
          "Cache-Control": NO_STORE,
        },
      });
    }
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const headers = imageHeaders(object.httpEtag, immutable, object);
  if (isHead) return new Response(null, { headers });

  const response = new Response((object as R2ObjectBody).body, { headers });
  if (immutable) {
    cacheAfterResponse(CACHE_NAME, cacheKey, response.clone());
  }
  return response;
}
