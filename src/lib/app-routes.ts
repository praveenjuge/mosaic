/**
 * Routes rendered per request (auth pages) or answered by server handlers
 * (OG endpoints). They are never prerendered and have no Markdown mirror.
 */
export const APP_ROUTE_PREFIXES = ["/sign-in", "/sign-up", "/use", "/i"];

/** True when `path` equals one of the prefixes or sits below it. */
export function matchesPathPrefix(
  path: string,
  prefixes: readonly string[],
): boolean {
  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
