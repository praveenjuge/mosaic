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

export function buildSignInHref(redirectUrl?: string) {
  const safeRedirect = sanitizeRedirectPath(redirectUrl);
  return `${signInPath}?redirect_url=${encodeURIComponent(safeRedirect)}`;
}

export function buildSignUpHref(redirectUrl?: string) {
  const safeRedirect = sanitizeRedirectPath(redirectUrl);
  return `${signUpPath}?redirect_url=${encodeURIComponent(safeRedirect)}`;
}
