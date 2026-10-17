import {
  routeAuthFromBrowserClerk,
  routeAuthFromCookies,
  type BrowserClerk,
  type RouteAuth,
} from "@/lib/browser-route-auth";
import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export const authenticatedHomePath = "/";
export const signInPath = "/sign-in";
export const signUpPath = "/sign-up";

export type { RouteAuth };

export const fetchRouteAuth = createServerFn().handler(
  async (): Promise<RouteAuth> => {
    const { userId } = await auth();

    return {
      userId,
      isAuthenticated: userId !== null,
    };
  },
);

export async function getRouteAuth(): Promise<RouteAuth> {
  if (typeof window !== "undefined") {
    const browserAuth = routeAuthFromBrowserClerk(
      (window as { Clerk?: BrowserClerk }).Clerk,
    );
    if (browserAuth) return browserAuth;
    const cookieAuth = routeAuthFromCookies(document.cookie);
    if (cookieAuth) return cookieAuth;
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
