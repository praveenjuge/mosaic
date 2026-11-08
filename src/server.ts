/**
 * The Worker's entry point. The public `/use` and `/i/*` endpoints answer
 * here, before TanStack Start's request middleware, Clerk, and the router:
 * they don't depend on who is signed in, so crawlers and image requests skip
 * session verification and never load the app's rendering code. REVIEW.md:
 * they never set cookies. Everything else goes to Start.
 */

import { registerLazyChunks } from "@/lib/preloadable-lazy";
import { setSecurityHeaders } from "@/lib/security-headers";
import { serveImage } from "@/server/image-serving";
import { handleUseRequest } from "@/server/use-endpoint";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import lazyChunks from "virtual:mosaic-lazy-chunks";

registerLazyChunks(lazyChunks);

const PUBLIC_ENDPOINT = /^\/(use$|i\/)/;

/**
 * They take no credentials and return no per-user data, so any origin may
 * read them.
 */
const publicCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** A copy of `response` with the CORS and security headers set. */
function withPublicHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(publicCorsHeaders)) {
    headers.set(name, value);
  }
  setSecurityHeaders(headers);
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

async function handlePublicEndpoint(
  request: Request,
  pathname: string,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (pathname.startsWith("/i/")) {
    if (request.method === "GET" || request.method === "HEAD") {
      return serveImage(request);
    }
  } else if (request.method === "GET") {
    return handleUseRequest(request);
  } else if (request.method === "HEAD") {
    // As Start did: answer HEAD like GET, without the body.
    const response = await handleUseRequest(request);
    await response.body?.cancel();
    return new Response(null, response);
  }
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "GET, HEAD, OPTIONS" },
  });
}

export default createServerEntry({
  async fetch(request, opts) {
    const { pathname } = new URL(request.url);
    if (PUBLIC_ENDPOINT.test(pathname)) {
      return withPublicHeaders(await handlePublicEndpoint(request, pathname));
    }
    return handler.fetch(request, opts);
  },
});
