/**
 * Markdown content negotiation (acceptmarkdown.com).
 *
 * TanStack Start's SSR handler rejects page requests whose Accept header does
 * not allow text/html with a 500 JSON error ("Only HTML requests are
 * supported here"). Agents that send Accept: text/markdown therefore get a
 * server error instead of a usable response. This module decides, for public
 * content routes, when a request prefers Markdown and builds the response;
 * the content itself is resolved by markdown-content.ts.
 */

export type MarkdownContentRef =
  | { kind: "home" }
  | { kind: "help"; slug: string }
  | { kind: "guide"; slug: string }
  | { kind: "legal" }
  | { kind: "not-found" };

const markdownContentType = "text/markdown; charset=utf-8";

/** Composes a Markdown document headed by the page title. */
export function toMarkdownDocument(title: string, content: string): string {
  const trimmed = content.trim();
  const heading = trimmed.match(/^# ([^\n]+?)\s*\n/);

  if (
    heading &&
    heading[1].trim().toLowerCase() === title.trim().toLowerCase()
  ) {
    // Drop the source heading only when it repeats the page title.
    return `# ${title}\n\n${trimmed.slice(heading[0].length)}\n`;
  }

  return `# ${title}\n\n${trimmed}\n`;
}

type AcceptEntry = { type: string; q: number };

function parseAcceptHeader(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((part) => {
      const [type, ...params] = part.split(";");
      let q = 1;

      for (const param of params) {
        const match = param.trim().match(/^q=\s*([0-9]*\.?[0-9]+)$/i);
        if (match) {
          q = Number.parseFloat(match[1]);
        }
      }

      return { type: type.trim().toLowerCase(), q };
    })
    .filter((entry) => entry.type !== "");
}

function qualityFor(entries: AcceptEntry[], type: string): number | undefined {
  return entries.find((entry) => entry.type === type)?.q;
}

/**
 * True when the client explicitly accepts Markdown and does not clearly
 * prefer HTML. Plain HTML browser Accept headers never mention Markdown, so
 * browser traffic is unaffected.
 */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) {
    return false;
  }

  const entries = parseAcceptHeader(acceptHeader);
  const markdownQ = qualityFor(entries, "text/markdown") ?? 0;

  if (markdownQ <= 0) {
    return false;
  }

  // The most specific matching range wins: an explicit text/html entry sets
  // HTML's quality even when a wildcard range is present.
  const htmlQ =
    qualityFor(entries, "text/html") ??
    qualityFor(entries, "text/*") ??
    qualityFor(entries, "*/*") ??
    0;

  return markdownQ >= htmlQ;
}

/**
 * True when the Accept header lets the client take an HTML page the way
 * TanStack Start's SSR handler checks it: an explicit text/html range or a
 * full wildcard with a non-zero quality. A text wildcard alone is not enough
 * for that handler, so it does not count. A missing header counts as
 * accepting anything.
 */
export function acceptsHtml(acceptHeader: string | null): boolean {
  if (!acceptHeader) {
    return true;
  }

  const entries = parseAcceptHeader(acceptHeader);
  const html = qualityFor(entries, "text/html");

  if (html !== undefined) {
    return html > 0;
  }

  // An explicit refusal of text/* also refuses HTML, whatever the full wildcard says.
  if (qualityFor(entries, "text/*") === 0) {
    return false;
  }

  return (qualityFor(entries, "*/*") ?? 0) > 0;
}

function normalizePathname(pathname: string): string {
  let decoded = pathname;

  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Keep the raw pathname when it is not validly encoded.
  }

  if (decoded.length > 1 && decoded.endsWith("/")) {
    return decoded.slice(0, -1);
  }

  return decoded;
}

/** Maps content routes and unknown pages to Markdown; leaves app and asset routes alone. */
export function matchMarkdownPath(pathname: string): MarkdownContentRef | null {
  const path = normalizePathname(pathname);

  if (path === "/") {
    return { kind: "home" };
  }

  if (path === "/legal") {
    return { kind: "legal" };
  }

  const guideMatch = path.match(/^\/help\/guides\/([^/]+)$/);
  if (guideMatch) {
    return { kind: "guide", slug: guideMatch[1] };
  }

  const helpMatch = path.match(/^\/help\/([^/]+)$/);
  if (helpMatch && helpMatch[1] !== "guides") {
    return { kind: "help", slug: helpMatch[1] };
  }

  // Leave known app, API, redirect and static paths to their existing handlers.
  // Unrecognized page URLs otherwise reach TanStack's HTML-only SSR handler,
  // which responds 500 to an agent asking for Markdown instead of a 404.
  if (path === "/help") return null;

  const reserved = [
    "/dashboard",
    "/sign-in",
    "/sign-up",
    "/i",
    "/use",
    "/api",
    "/blog",
    "/_",
    "/.well-known",
  ];
  if (
    reserved.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) ||
    /\.[a-z0-9]+$/i.test(path)
  ) {
    return null;
  }

  return { kind: "not-found" };
}

/**
 * Returns Markdown for recognized content or a 404 recovery document for
 * unknown public pages. Other requests continue through the normal pipeline.
 */
export function markdownNegotiationResponse(
  request: Request,
  resolveMarkdown: (ref: MarkdownContentRef) => string | null,
  siteOrigin = new URL(request.url).origin,
): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  if (!prefersMarkdown(request.headers.get("Accept"))) {
    return null;
  }

  const ref = matchMarkdownPath(new URL(request.url).pathname);
  if (!ref) {
    return null;
  }

  const markdown = resolveMarkdown(ref);
  const notFound = markdown === null;
  const errorBody = notFound
    ? `# Page not found\n\nThe requested page does not exist. [Browse the help guides](${siteOrigin}/help) or [see the sitemap](${siteOrigin}/sitemap.xml).\n`
    : null;

  // A recognized content path with no matching document answers 404 in
  // Markdown instead of falling through to the SSR handler, which rejects
  // non-HTML requests with a 500.
  return new Response(
    request.method === "HEAD"
      ? null
      : notFound
        ? errorBody
        : markdown,
    {
      status: notFound ? 404 : 200,
      headers: {
        "Content-Type": markdownContentType,
        Vary: "Accept",
      },
    },
  );
}
