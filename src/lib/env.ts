type PublicEnvValue = string | boolean | undefined;

const runtimeEnv: Record<string, PublicEnvValue> = {
  DEV: import.meta.env.DEV,
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  VITE_CONVEX_SITE_URL: import.meta.env.VITE_CONVEX_SITE_URL,
  VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
};

function readPublicEnv(keys: string[], fallback?: string) {
  for (const key of keys) {
    const value = runtimeEnv[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing public environment variable. Checked: ${keys.join(", ")}`);
}

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function deriveConvexSiteUrl(convexUrl: string) {
  const url = new URL(convexUrl);

  if (url.hostname.endsWith(".convex.cloud")) {
    url.hostname = url.hostname.replace(/\.convex\.cloud$/, ".convex.site");
  } else if (
    runtimeEnv.DEV &&
    (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
    url.port === "3210"
  ) {
    url.port = "3211";
  }

  return normalizeBaseUrl(url.toString());
}

const convexUrl = readPublicEnv(["VITE_CONVEX_URL"]);

export const publicEnv = {
  siteUrl: normalizeBaseUrl(
    readPublicEnv(
      ["VITE_SITE_URL"],
      runtimeEnv.DEV ? "http://localhost:3000/" : "https://mosaicimg.com/",
    ),
  ),
  convexUrl,
  convexSiteUrl: normalizeBaseUrl(
    readPublicEnv(["VITE_CONVEX_SITE_URL"], deriveConvexSiteUrl(convexUrl)),
  ),
  clerkPublishableKey: readPublicEnv(["VITE_CLERK_PUBLISHABLE_KEY"], ""),
} as const;
