/**
 * Content negotiation for public pages (acceptmarkdown.com).
 *
 * TanStack Start's SSR handler answers a page request whose Accept header
 * excludes text/html with a 500 and `{"error": "Only HTML requests are
 * supported here"}`. This module answers those requests first: Markdown for
 * clients that prefer it, and a 404 or 406 problem document for clients that
 * take neither HTML nor Markdown. Browser requests and app routes continue
 * through the normal pipeline.
 */

/** Composes a Markdown document headed by the page title. */
export function toMarkdownDocument(title: string, content: string): string {
  const trimmed = content.trim();
  const heading = trimmed.match(/^# ([^\n]+?)\s*\n/);

  // Drop the source heading only when it repeats the page title.
  const body =
    heading && heading[1].trim().toLowerCase() === title.trim().toLowerCase()
      ? trimmed.slice(heading[0].length)
      : trimmed;

  return `# ${title}\n\n${body}\n`;
}

// ── Accept header ───────────────────────────────────────────────────

function acceptQualities(header: string): Map<string, number> {
  const qualities = new Map<string, number>();

  for (const part of header.split(",")) {
    const [type, ...params] = part.split(";");
    const mediaType = type.trim().toLowerCase();
    if (!mediaType) continue;

    let q = 1;
    for (const param of params) {
      const match = param.trim().match(/^q=\s*([0-9]*\.?[0-9]+)$/i);
      if (match) q = Number.parseFloat(match[1]);
    }
    if (!qualities.has(mediaType)) qualities.set(mediaType, q);
  }

  return qualities;
}

/**
 * True when the client explicitly accepts Markdown and does not clearly
 * prefer HTML. Browser Accept headers never mention Markdown.
 */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  const q = acceptQualities(acceptHeader);
  const markdownQ = q.get("text/markdown") ?? 0;
  if (markdownQ <= 0) return false;

  // The most specific matching range sets HTML's quality.
  const htmlQ = q.get("text/html") ?? q.get("text/*") ?? q.get("*/*") ?? 0;
  return markdownQ >= htmlQ;
}

/**
 * True when the Accept header lets the client take an HTML page the way
 * TanStack Start's SSR handler checks it: an explicit text/html range or a
 * full wildcard with a non-zero quality. A text wildcard alone is not enough
 * for that handler. A missing header accepts anything.
 */
export function acceptsHtml(acceptHeader: string | null): boolean {
  if (!acceptHeader) return true;

  const q = acceptQualities(acceptHeader);
  const html = q.get("text/html");
  if (html !== undefined) return html > 0;

  // An explicit refusal of text/* also refuses HTML.
  if (q.get("text/*") === 0) return false;

  return (q.get("*/*") ?? 0) > 0;
}

// ── Paths ───────────────────────────────────────────────────────────

const appRoutePrefixes = [
  "/dashboard",
  "/sign-in",
  "/sign-up",
  "/i",
  "/use",
  "/blog",
  "/_serverFn",
  "/.well-known",
];

function normalizePathname(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Keep the raw pathname when it is not validly encoded.
  }
  return decoded.length > 1 ? decoded.replace(/\/+$/, "") : decoded;
}

/** App routes, redirects and static files keep their own handlers. */
function isAppRoute(path: string): boolean {
  return (
    appRoutePrefixes.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    ) || /\.[a-z0-9]+$/i.test(path)
  );
}

// ── Responses ───────────────────────────────────────────────────────

function respond(
  request: Request,
  status: number,
  contentType: string,
  body: string,
): Response {
  return new Response(request.method === "HEAD" ? null : body, {
    status,
    headers: { "Content-Type": contentType, Vary: "Accept" },
  });
}

/** RFC 9457 problem details with a stable code and a recovery hint. */
function problem(
  request: Request,
  status: 404 | 406,
  detail: string,
  resolution: string,
): Response {
  const [title, code] =
    status === 404
      ? ["Not Found", "not_found"]
      : ["Not Acceptable", "not_acceptable"];
  const body = JSON.stringify({
    type: "about:blank",
    title,
    status,
    code,
    detail,
    resolution,
  });
  return respond(request, status, "application/problem+json", body);
}

/**
 * Answers a GET or HEAD for a public page when the client prefers Markdown
 * or cannot take HTML. `markdownPages` maps each content pathname to its
 * Markdown. Returns null to let the request continue.
 */
export function negotiateResponse(
  request: Request,
  markdownPages: Record<string, string>,
  siteOrigin = new URL(request.url).origin,
): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const accept = request.headers.get("Accept");
  const wantsMarkdown = prefersMarkdown(accept);
  if (!wantsMarkdown && acceptsHtml(accept)) return null;

  const path = normalizePathname(new URL(request.url).pathname);
  if (isAppRoute(path)) return null;

  const markdown = Object.hasOwn(markdownPages, path)
    ? markdownPages[path]
    : null;

  if (wantsMarkdown) {
    return markdown === null
      ? respond(
          request,
          404,
          "text/markdown; charset=utf-8",
          `# Page not found\n\nThe requested page does not exist. [Browse the help guides](${siteOrigin}/help) or [see the sitemap](${siteOrigin}/sitemap.xml).\n`,
        )
      : respond(request, 200, "text/markdown; charset=utf-8", markdown);
  }

  return markdown === null
    ? problem(
        request,
        404,
        `No page exists at ${path}.`,
        `Browse the help guides at ${siteOrigin}/help or the sitemap at ${siteOrigin}/sitemap.xml.`,
      )
    : problem(
        request,
        406,
        `${path} is only available as text/html or text/markdown.`,
        "Send Accept: text/markdown for the page content, or Accept: text/html for the web page.",
      );
}
