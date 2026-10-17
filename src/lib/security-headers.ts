import { addAcceptToVary } from "@/lib/vary";

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

/** Headers every Worker response carries, set by `src/start.ts` and `src/server.ts`. */
export function setSecurityHeaders(headers: Headers): void {
  headers.set("Content-Security-Policy", cspHeader);
  headers.set("Referrer-Policy", "same-origin");
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  headers.set("X-Content-Type-Options", "nosniff");

  addAcceptToVary(headers);
}

/** A copy of `response` with the security headers set. */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  setSecurityHeaders(headers);
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}
