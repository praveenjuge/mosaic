export const authenticatedHomePath = "/";
export const signInPath = "/sign-in";
export const signUpPath = "/sign-up";

/** The sign-in and sign-up pages, which are Clerk's forms. */
export function isAuthPage(pathname: string) {
  return [signInPath, signUpPath].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Route auth as `beforeLoad` sees it. */
export type RouteAuth = {
  userId: string | null;
  isAuthenticated: boolean;
};

/** Clerk cookies that mean a session exists or may need a handshake. */
export function hasClerkSession(cookieHeader: string | null): boolean {
  for (const part of (cookieHeader ?? "").split(";")) {
    const separator = part.indexOf("=");
    const name = (separator === -1 ? part : part.slice(0, separator)).trim();
    const value = separator === -1 ? "" : part.slice(separator + 1).trim();
    if (name.startsWith("__session") || name.startsWith("__clerk")) {
      return true;
    }
    // `__client_uat` is "0" once signed out; anything else means signed in
    // on another tab or domain, which Clerk resolves with a handshake.
    if (name.startsWith("__client_uat") && value !== "0") return true;
  }
  return false;
}

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

export async function getRouteAuth(): Promise<RouteAuth> {
  if (typeof window !== "undefined") {
    const browserAuth = routeAuthFromBrowserClerk(
      (window as { Clerk?: BrowserClerk }).Clerk,
    );
    if (browserAuth) return browserAuth;
    const cookieAuth = routeAuthFromCookies(document.cookie);
    if (cookieAuth) return cookieAuth;
  }
  // Imported only when needed, so the browser loads the server function
  // runtime (about 12 KB) only when it calls one.
  const { fetchRouteAuth } = await import("@/server/route-auth");
  return fetchRouteAuth();
}

export function sanitizeRedirectPath(redirectUrl?: string) {
  if (
    !redirectUrl ||
    !redirectUrl.startsWith("/") ||
    redirectUrl.startsWith("//")
  ) {
    return authenticatedHomePath;
  }

  try {
    const parsed = new URL(redirectUrl, "https://mosaic.local");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return authenticatedHomePath;
  }
}

export function validateRedirectSearch(search: Record<string, unknown>) {
  return {
    redirect_url:
      typeof search.redirect_url === "string" ? search.redirect_url : undefined,
  };
}
