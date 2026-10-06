import {
  acceptsHtml,
  type MarkdownContentRef,
  matchMarkdownPath,
  prefersMarkdown,
} from "./markdown-negotiation";

type ProblemInput = {
  code: string;
  detail: string;
  resolution: string;
  status: number;
  title: string;
};

/** RFC 9457 problem details with a stable code and a recovery hint. */
function problemResponse(request: Request, problem: ProblemInput): Response {
  const body = JSON.stringify({
    type: "about:blank",
    title: problem.title,
    status: problem.status,
    code: problem.code,
    detail: problem.detail,
    resolution: problem.resolution,
  });

  return new Response(request.method === "HEAD" ? null : body, {
    status: problem.status,
    headers: {
      "Content-Type": "application/problem+json",
      Vary: "Accept",
    },
  });
}

function notAcceptable(request: Request, pathname: string): Response {
  return problemResponse(request, {
    code: "not_acceptable",
    detail: `${pathname} is only available as text/html or text/markdown.`,
    resolution:
      "Send Accept: text/markdown for the page content, or Accept: text/html for the web page.",
    status: 406,
    title: "Not Acceptable",
  });
}

/**
 * Structured errors for clients that cannot take HTML or Markdown.
 *
 * TanStack Start's SSR handler answers a page request whose Accept header
 * excludes text/html with a 500 and a bare `{"error": "Only HTML requests
 * are supported here"}`. An unknown URL or a content page asked for as JSON
 * is not a server fault, so answer 404 or 406 with a problem document that
 * says how to recover. Requests that can take HTML, Markdown responses, and
 * app routes keep their existing handling.
 */
export function nonHtmlErrorResponse(
  request: Request,
  resolveMarkdown: (ref: MarkdownContentRef) => string | null,
  siteOrigin = new URL(request.url).origin,
): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  const accept = request.headers.get("Accept");
  if (acceptsHtml(accept) || prefersMarkdown(accept)) {
    return null;
  }

  const { pathname } = new URL(request.url);

  // Framework endpoints such as /_serverFn/<id> are called with non-HTML
  // Accept headers and must reach their handlers.
  if (pathname.startsWith("/_")) {
    return null;
  }

  // This site has no JSON API; every /api URL is unknown.
  const unknownApi = pathname === "/api" || pathname.startsWith("/api/");
  // The help index is a known page that has no Markdown form of its own.
  const helpIndex = pathname === "/help" || pathname === "/help/";
  const ref = unknownApi || helpIndex ? null : matchMarkdownPath(pathname);

  if (!(unknownApi || helpIndex || ref)) {
    return null;
  }

  if (helpIndex) {
    return notAcceptable(request, pathname);
  }

  if (unknownApi || resolveMarkdown(ref as MarkdownContentRef) === null) {
    return problemResponse(request, {
      code: "not_found",
      detail: `No page exists at ${pathname}.`,
      resolution: `Browse the help guides at ${siteOrigin}/help or the sitemap at ${siteOrigin}/sitemap.xml.`,
      status: 404,
      title: "Not Found",
    });
  }

  return notAcceptable(request, pathname);
}
