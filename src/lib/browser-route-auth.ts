import { hasClerkSession } from "@/lib/page-cache";

/** Route auth as `beforeLoad` sees it. */
export type RouteAuth = {
  userId: string | null;
  isAuthenticated: boolean;
};

/** The part of the browser's `window.Clerk` that route auth reads. */
export type BrowserClerk = {
  loaded?: boolean;
  user?: { id: string } | null;
  session?: { status?: string } | null;
};

/**
 * Route auth from Clerk's client state, or `null` until Clerk has loaded.
 * Like the server's `auth()`, only an `active` session counts as signed in:
 * a `pending` one (sign-in tasks still to finish) is signed out.
 */
export function routeAuthFromBrowserClerk(
  clerk: BrowserClerk | undefined,
): RouteAuth | null {
  if (!clerk?.loaded) return null;
  const userId =
    clerk.session?.status === "active" ? (clerk.user?.id ?? null) : null;
  return { userId, isAuthenticated: userId !== null };
}

/**
 * Signed out when the browser holds no Clerk session cookie, or `null` when
 * only the server can tell. Signed-out pages don't load Clerk, so this keeps
 * their client navigations from asking the server who is signed in.
 */
export function routeAuthFromCookies(cookies: string): RouteAuth | null {
  return hasClerkSession(cookies)
    ? null
    : { userId: null, isAuthenticated: false };
}
