import { signInPath, signUpPath } from "@/lib/clerk-auth";
import { publicEnv } from "@/lib/env";
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
      clerkMiddleware({
        publishableKey: publicEnv.clerkPublishableKey,
        signInUrl: signInPath,
        signUpUrl: signUpPath,
      }),
      securityHeadersMiddleware,
    ],
  };
});
