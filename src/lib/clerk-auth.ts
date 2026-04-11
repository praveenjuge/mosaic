import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export const dashboardPath = "/dashboard";
export const signInPath = "/sign-in";
export const signUpPath = "/sign-up";

export const fetchClerkAuth = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getToken, userId } = await auth();
    const token = await getToken();

    return { token, userId };
  },
);

export function sanitizeRedirectPath(redirectUrl?: string) {
  if (!redirectUrl || !redirectUrl.startsWith("/") || redirectUrl.startsWith("//")) {
    return dashboardPath;
  }

  try {
    const parsed = new URL(redirectUrl, "https://mosaic.local");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return dashboardPath;
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
