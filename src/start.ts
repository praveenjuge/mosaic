import { signInPath, signUpPath } from "@/lib/clerk-auth";
import { publicEnv } from "@/lib/env";
import { negotiateResponse } from "@/lib/markdown-negotiation";
import {
  isCacheablePageRequest,
  isCacheablePageResponse,
  isStorablePageRequest,
  pageCacheKey,
} from "@/lib/page-cache";
import { withSecurityHeaders } from "@/lib/security-headers";
import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { waitUntil } from "cloudflare:workers";
import appCss from "./styles/app.css?url";
import geistCore from "./styles/fonts/geist-core.woff2?url";

/** Set per build by `vite.config.ts`; keys the page cache to one deploy. */
declare const __MOSAIC_BUILD_ID__: string;

const siteOrigin = new URL(publicEnv.siteUrl).origin;

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});

/**
 * The render-blocking stylesheet and the font it names, which `__root.tsx`
 * also links. As a `Link` header, Cloudflare can send them as 103 Early
 * Hints (when the zone enables them) while the Worker is still rendering.
 */
const earlyHints = [
  `<${appCss}>; rel=preload; as=style`,
  `<${geistCore}>; rel=preload; as=font; type="font/woff2"; crossorigin`,
].join(", ");

// `/use` and `/i/*` answer in `src/server.ts` and never reach these.
const securityHeadersMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const result = await next();
    const response = withSecurityHeaders(result.response);
    if (response.headers.get("Content-Type")?.startsWith("text/html")) {
      response.headers.set("Link", earlyHints);
    }
    return { ...result, response };
  },
);

const contentNegotiationMiddleware = createMiddleware({
  type: "request",
}).server(async ({ request, next }) => {
  // Imported here so the Markdown mirror stays out of the client bundle.
  const { default: markdownPages } =
    await import("virtual:mosaic-content/markdownPages");
  return negotiateResponse(request, markdownPages, siteOrigin) ?? next();
});

const PAGE_CACHE_NAME = "mosaic:pages";
// Keys include the build ID, so a deploy replaces every cached page.
const PAGE_CACHE_CONTROL = "public, max-age=86400";

/**
 * Serves signed-out content pages from the colo's Cache API, so repeat
 * visits skip Clerk and rendering. See `src/lib/page-cache.ts` for which
 * requests qualify. Runs after content negotiation, so only HTML reaches it.
 */
const pageCacheMiddleware = createMiddleware({ type: "request" }).server(
  async ({ request, next }) => {
    if (
      !import.meta.env.PROD ||
      !isCacheablePageRequest(request, publicEnv.clerkPublishableKey)
    ) {
      return next();
    }

    const cache = await caches.open(PAGE_CACHE_NAME);
    const key = pageCacheKey(request, __MOSAIC_BUILD_ID__);
    const cached = await cache.match(key);
    if (cached) {
      const headers = new Headers(cached.headers);
      // The stored Cache-Control is for the Cache API, not for browsers.
      headers.delete("Cache-Control");
      headers.set("X-Mosaic-Cache", "HIT");
      return new Response(cached.body, { status: cached.status, headers });
    }

    const result = await next();
    if (
      isStorablePageRequest(request) &&
      isCacheablePageResponse(result.response)
    ) {
      const [body, copy] = result.response.body?.tee() ?? [null, null];
      const stored = new Headers(result.response.headers);
      stored.set("Cache-Control", PAGE_CACHE_CONTROL);
      waitUntil(
        cache
          .put(key, new Response(copy, { status: 200, headers: stored }))
          .catch((error: unknown) => {
            console.error("[PAGES] Failed to cache page:", error);
          }),
      );
      const headers = new Headers(result.response.headers);
      headers.set("X-Mosaic-Cache", "MISS");
      return {
        ...result,
        response: new Response(body, {
          status: result.response.status,
          statusText: result.response.statusText,
          headers,
        }),
      };
    }
    return result;
  },
);

export const startInstance = createStart(() => {
  return {
    // Security headers wrap every response, including cached and Markdown
    // ones. Markdown and cached pages answer before Clerk runs: neither
    // depends on who is signed in.
    requestMiddleware: [
      csrfMiddleware,
      securityHeadersMiddleware,
      contentNegotiationMiddleware,
      pageCacheMiddleware,
      clerkMiddleware({
        publishableKey: publicEnv.clerkPublishableKey,
        signInUrl: signInPath,
        signUpUrl: signUpPath,
      }),
    ],
  };
});
