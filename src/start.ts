import { signInPath, signUpPath } from "@/lib/clerk-auth";
import { publicEnv } from "@/lib/env";
import { negotiateResponse } from "@/lib/markdown-negotiation";
import {
  isCacheablePageRequest,
  isCacheablePageResponse,
  pageCacheKey,
} from "@/lib/page-cache";
import { addAcceptToVary } from "@/lib/vary";
import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { waitUntil } from "cloudflare:workers";

/** Set per build by `vite.config.ts`; keys the page cache to one deploy. */
declare const __MOSAIC_BUILD_ID__: string;

const cspHeader = [
  // data: lets the home page demo show its inline screenshot.
  "img-src 'self' data: https://img.clerk.com https://avatars.githubusercontent.com *;",
  "font-src 'self' https://fonts.gstatic.com;",
  "worker-src 'self' blob:;",
  "style-src 'self' 'unsafe-inline' https://www.gstatic.com;",
  "frame-src 'self' https://challenges.cloudflare.com;",
  "form-action 'self';",
  "frame-ancestors 'none';",
  "block-all-mixed-content;",
  import.meta.env.PROD ? "upgrade-insecure-requests;" : "",
]
  .filter(Boolean)
  .join(" ");

const siteOrigin = new URL(publicEnv.siteUrl).origin;

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});

const securityHeadersMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const result = await next();
    const headers = new Headers(result.response.headers);

    headers.set("Content-Security-Policy", cspHeader);
    headers.set("Referrer-Policy", "same-origin");
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
    headers.set("X-Content-Type-Options", "nosniff");

    addAcceptToVary(headers);

    return {
      ...result,
      response: new Response(result.response.body, {
        headers,
        status: result.response.status,
        statusText: result.response.statusText,
      }),
    };
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
const PAGE_CACHE_CONTROL = "public, max-age=3600";

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
    if (isCacheablePageResponse(result.response)) {
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
