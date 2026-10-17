import { signInPath, signUpPath } from "@/lib/clerk-auth";
import { publicEnv } from "@/lib/env";
import { negotiateResponse } from "@/lib/markdown-negotiation";
import { addAcceptToVary } from "@/lib/vary";
import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";

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
    headers.set("X-DNS-Prefetch-Control", "on");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-XSS-Protection", "1; mode=block");

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

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [
      csrfMiddleware,
      clerkMiddleware({
        publishableKey: publicEnv.clerkPublishableKey,
        signInUrl: signInPath,
        signUpUrl: signUpPath,
      }),
      securityHeadersMiddleware,
      contentNegotiationMiddleware,
    ],
  };
});
