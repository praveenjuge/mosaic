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
