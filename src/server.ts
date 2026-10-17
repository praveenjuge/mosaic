/**
 * The Worker's entry point. The public `/use` and `/i/*` endpoints answer
 * here, before TanStack Start's request middleware, Clerk, and the router:
 * they don't depend on who is signed in, so crawlers and image requests skip
 * session verification and never load the app's rendering code. REVIEW.md:
 * they never set cookies. Everything else goes to Start.
 */

import { publicCorsHeaders } from "@/lib/cors";
import { serveImage } from "@/lib/image-serving";
import { handleUseRequest } from "@/lib/og-generation";
import { withSecurityHeaders } from "@/lib/security-headers";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

const PUBLIC_ENDPOINT = /^\/(use$|i\/)/;

async function handlePublicEndpoint(
  request: Request,
  pathname: string,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: publicCorsHeaders });
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
    headers: { ...publicCorsHeaders, Allow: "GET, HEAD, OPTIONS" },
  });
}

export default createServerEntry({
  async fetch(request, opts) {
    const { pathname } = new URL(request.url);
    if (PUBLIC_ENDPOINT.test(pathname)) {
      return withSecurityHeaders(await handlePublicEndpoint(request, pathname));
    }
    return handler.fetch(request, opts);
  },
});
