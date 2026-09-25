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
  | { kind: "legal" };

const markdownContentType = "text/markdown; charset=utf-8";

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

  const htmlQ = Math.max(
    qualityFor(entries, "text/html") ?? 0,
    qualityFor(entries, "text/*") ?? 0,
    qualityFor(entries, "*/*") ?? 0,
  );

  return markdownQ >= htmlQ;
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

/** Maps public content routes to their Markdown source; null elsewhere. */
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

  return null;
}

/**
 * Returns a Markdown response when the request prefers Markdown and the path
 * has Markdown content, otherwise null so the request continues to the
 * normal HTML pipeline.
 */
export function markdownNegotiationResponse(
  request: Request,
  resolveMarkdown: (ref: MarkdownContentRef) => string | null,
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
  if (markdown === null) {
    return null;
  }

  return new Response(request.method === "HEAD" ? null : markdown, {
    headers: {
      "Content-Type": markdownContentType,
      Vary: "Accept",
    },
  });
}
