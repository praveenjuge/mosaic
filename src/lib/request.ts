/**
 * Whether a request is trying to load an endpoint as a browser document.
 *
 * Browser Run sends these Fetch Metadata headers when a captured page redirects
 * back to Mosaic. Their presence is a useful recursion signal; their absence is
 * not proof of request intent because social crawlers may omit them.
 */
export function isDocumentNavigation(request: Request): boolean {
  return (
    request.headers.get("Sec-Fetch-Mode") === "navigate" ||
    request.headers.get("Sec-Fetch-Dest") === "document"
  );
}

/**
 * Block a concrete browser-navigation signal unless the route has independently
 * authorized the explicit preview intent. The unsigned image endpoint remains
 * public so social crawlers do not depend on auth or optional request headers.
 */
export function shouldRejectUseDocumentNavigation(
  request: Request,
  allowDocumentNavigation: boolean,
): boolean {
  return isDocumentNavigation(request) && !allowDocumentNavigation;
}
