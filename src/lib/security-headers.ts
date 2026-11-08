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

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  setSecurityHeaders(headers);
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

const negotiableContentTypes = [
  "text/html",
  "text/markdown",
  "application/json",
];

/** Pages answer HTML, Markdown, or JSON by `Accept`, so caches must vary on it. */
export function addAcceptToVary(headers: Headers): void {
  const mediaType =
    headers.get("Content-Type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";

  if (!negotiableContentTypes.includes(mediaType)) {
    return;
  }

  const vary = (headers.get("Vary") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const normalizedVary = new Set(vary.map((value) => value.toLowerCase()));

  if (!normalizedVary.has("*") && !normalizedVary.has("accept")) {
    vary.push("Accept");
  }

  headers.set("Vary", vary.join(", "));
}
