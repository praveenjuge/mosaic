export function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function required(name: string, value: string | undefined): string {
  if (value) return value;
  throw new Error(`Missing required public environment variable: ${name}`);
}

export const publicEnv = {
  siteUrl: ensureTrailingSlash(
    required("VITE_SITE_URL", import.meta.env.VITE_SITE_URL),
  ),
  clerkPublishableKey: required(
    "VITE_CLERK_PUBLISHABLE_KEY",
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  ),
} as const;
