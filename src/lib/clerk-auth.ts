import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export const authenticatedHomePath = "/";
export const signInPath = "/sign-in";
export const signUpPath = "/sign-up";

export type RouteAuth = {
  userId: string | null;
  isAuthenticated: boolean;
};

export const fetchRouteAuth = createServerFn().handler(
  async (): Promise<RouteAuth> => {
    const { userId } = await auth();

    return {
      userId,
      isAuthenticated: userId !== null,
    };
  },
);

/** The part of the browser's `window.Clerk` that route auth reads. */
type BrowserClerk = { loaded?: boolean; user?: { id: string } | null };

/**
 * Auth for route `beforeLoad`. Server rendering asks Clerk's middleware. In
 * the browser, once Clerk has loaded, its client state answers, so client
 * navigations don't wait on a server round trip. Server functions still
 * check `auth()` themselves; this only picks what to render.
 */
export async function getRouteAuth(): Promise<RouteAuth> {
  if (typeof window !== "undefined") {
    const clerk = (window as { Clerk?: BrowserClerk }).Clerk;
    if (clerk?.loaded) {
      const userId = clerk.user?.id ?? null;
      return { userId, isAuthenticated: userId !== null };
    }
  }
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
