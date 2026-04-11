import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export const authenticatedHomePath = "/";
export const signInPath = "/sign-in";
export const signUpPath = "/sign-up";

export type ClerkAuthState = {
  token: string | null;
  userId: string | null;
};

export type RouteAuth = ClerkAuthState & {
  isAuthenticated: boolean;
};

export const fetchClerkAuth = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClerkAuthState> => {
    const { getToken, userId } = await auth();
    const token = await getToken();

    return { token, userId };
  },
);

export function buildRouteAuth({ token, userId }: ClerkAuthState): RouteAuth {
  return {
    token,
    userId,
    isAuthenticated: userId !== null,
  };
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

    if (parsed.pathname === "/dashboard") {
      return authenticatedHomePath;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return authenticatedHomePath;
  }
}

export function buildSignInHref(redirectUrl?: string) {
  const safeRedirect = sanitizeRedirectPath(redirectUrl);
  return `${signInPath}?redirect_url=${encodeURIComponent(safeRedirect)}`;
}

export function buildSignUpHref(redirectUrl?: string) {
  const safeRedirect = sanitizeRedirectPath(redirectUrl);
  return `${signUpPath}?redirect_url=${encodeURIComponent(safeRedirect)}`;
}
