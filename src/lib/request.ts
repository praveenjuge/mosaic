/**
 * Whether a request is trying to load an endpoint as a browser document.
 *
 * Browser Run sends the same Fetch Metadata headers when a captured page
 * redirects back to Mosaic, so callers can distinguish interactive previews
 * from image subresource requests.
 */
export function isDocumentNavigation(request: Request): boolean {
  return (
    request.headers.get("Sec-Fetch-Mode") === "navigate" ||
    request.headers.get("Sec-Fetch-Dest") === "document"
  );
}

/**
 * Block document loads unless the route has verified an interactive session.
 * Image subresources stay public so social crawlers do not depend on auth.
 */
export function shouldRejectUseDocumentNavigation(
  request: Request,
  allowDocumentNavigation: boolean,
): boolean {
  return isDocumentNavigation(request) && !allowDocumentNavigation;
}
