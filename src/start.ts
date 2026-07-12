import { signInPath, signUpPath } from "@/lib/clerk-auth";
import { publicEnv } from "@/lib/env";
import { DEFAULT_SITE_URL, LEGACY_HOST } from "@/lib/url";
import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createMiddleware, createStart } from "@tanstack/react-start";

const cspHeader = [
  "img-src 'self' https://img.clerk.com https://avatars.githubusercontent.com https://pub-84f0589ebfe14c319d4884539bf9f1b7.r2.dev *;",
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

// Permanently redirect the legacy domain to the canonical one, while keeping
// the OG image endpoint (`/use`) alive for embeds already in the wild — those
// requests are served normally and 307-redirect to the new image host on their
// own. `og.mosaicimg.com` is served directly by R2 and never reaches here.
const legacyDomainRedirectMiddleware = createMiddleware({
  type: "request",
}).server(async ({ next, request }) => {
  const url = new URL(request.url);

  if (url.hostname === LEGACY_HOST && url.pathname !== "/use") {
    const target = new URL(`${url.pathname}${url.search}`, DEFAULT_SITE_URL);
    throw new Response(null, {
      status: 301,
      headers: {
        Location: target.toString(),
        "Cache-Control": "public, max-age=3600",
        "Strict-Transport-Security":
          "max-age=63072000; includeSubDomains; preload",
      },
    });
  }

  return next();
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
    headers.set("X-DNS-Prefetch-Control", "on");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");

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

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [
      legacyDomainRedirectMiddleware,
      clerkMiddleware({
        publishableKey: publicEnv.clerkPublishableKey,
        signInUrl: signInPath,
        signUpUrl: signUpPath,
      }),
      securityHeadersMiddleware,
    ],
  };
});
