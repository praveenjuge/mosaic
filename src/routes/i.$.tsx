import { publicCorsHeaders } from "@/lib/cors";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

/**
 * Serves OG images from R2 at `/i/<r2key>`. R2 keys contain slashes
 * (`global/<hash>.jpeg`), so this is a splat route.
 *
 * R2 is the authoritative source for every request. Avoiding the colo-local
 * Cache API prevents a CDN response from outliving the shared D1 expiry and
 * keeps GET/HEAD consistent.
 */
async function serveImage(request: Request): Promise<Response> {
  const raw = new URL(request.url).pathname.replace(/^\/+i\/+/, "");
  let key = raw;
  try {
    key = decodeURIComponent(raw);
  } catch {
    // Keep the raw key when it is not validly encoded.
  }

  const isHead = request.method === "HEAD";
  const object: R2Object | R2ObjectBody | null = !key
    ? null
    : isHead
      ? await env.OG_BUCKET.head(key)
      : await env.OG_BUCKET.get(key);
  if (!object) {
    return new Response("Not found", {
      status: 404,
      headers: { ...publicCorsHeaders, "Cache-Control": "no-store" },
    });
  }

  const headers = new Headers(publicCorsHeaders);
  object.writeHttpMetadata(headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "image/jpeg");
  headers.set("Cache-Control", "private, no-store");
  headers.set("ETag", object.httpEtag);

  const body = isHead ? null : (object as R2ObjectBody).body;
  return new Response(body, { status: 200, headers });
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
