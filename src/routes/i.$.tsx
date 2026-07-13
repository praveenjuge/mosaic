import { createFileRoute } from "@tanstack/react-router";
import { env, waitUntil } from "cloudflare:workers";

/**
 * Serves OG images directly from R2 through the Worker at `/i/<r2key>`.
 *
 * The application origin serves both the app and its images.
 *
 * R2 keys contain slashes (`<prefix>/<hash>.jpeg` or `demo/<hash>.jpeg`), so
 * this is a splat route and the key is read from the path after `/i/`.
 *
 * Images are content-addressed: `refreshSiteImages` rotates the R2 prefix, so
 * a refreshed image gets a brand-new key. That makes immutable, long-lived
 * caching safe — a stale key is simply orphaned and never re-requested.
 */

const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

const imageCorsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Extract the R2 object key from the request path. The route is mounted at
 * `/i/`, so everything after that prefix (slashes included) is the key.
 */
function extractR2Key(request: Request): string {
  const { pathname } = new URL(request.url);
  const raw = pathname.replace(/^\/+i\/+/, "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { ...imageCorsHeaders, "Cache-Control": "no-store" },
  });
}

function buildImageHeaders(object: R2Object): Headers {
  const headers = new Headers(imageCorsHeaders);
  object.writeHttpMetadata(headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "image/jpeg");
  }
  headers.set("Cache-Control", IMAGE_CACHE_CONTROL);
  headers.set("ETag", object.httpEtag);
  return headers;
}

function edgeCache(): Cache {
  return (caches as unknown as { default: Cache })["default"];
}

async function serveImage(request: Request): Promise<Response> {
  const key = extractR2Key(request);
  if (!key) return notFound();

  const cache = edgeCache();
  const cached = await cache.match(request);
  if (cached) return cached;

  const object = await env.OG_BUCKET.get(key);
  if (!object) return notFound();

  const response = new Response(object.body, {
    status: 200,
    headers: buildImageHeaders(object),
  });

  // Populate the edge cache without blocking the response.
  waitUntil(cache.put(request, response.clone()));
  return response;
}

async function headImage(request: Request): Promise<Response> {
  const key = extractR2Key(request);
  if (!key) return notFound();

  const object = await env.OG_BUCKET.head(key);
  if (!object) return notFound();

  return new Response(null, {
    status: 200,
    headers: buildImageHeaders(object),
  });
}

export const Route = createFileRoute("/i/$")({
  server: {
    handlers: {
      GET: async ({ request }) => serveImage(request),
      HEAD: async ({ request }) => headImage(request),
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: imageCorsHeaders }),
    },
  },
});
