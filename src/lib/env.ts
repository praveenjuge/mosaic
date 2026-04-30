function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

type PublicEnvValue = string | boolean | undefined;

const runtimeEnv: Record<string, PublicEnvValue> = {
  DEV: import.meta.env.DEV,
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
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

  throw new Error(
    `Missing public environment variable. Checked: ${keys.join(", ")}`,
  );
}

export const publicEnv = {
  siteUrl: ensureTrailingSlash(
    readPublicEnv(
      ["VITE_SITE_URL"],
      runtimeEnv.DEV ? "http://localhost:3000/" : "https://mosaicimg.com/",
    ),
  ),
  clerkPublishableKey: readPublicEnv(["VITE_CLERK_PUBLISHABLE_KEY"], ""),
} as const;
