function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

type PublicEnvValue = string | undefined;

const runtimeEnv: Record<string, PublicEnvValue> = {
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
};

function readPublicEnv(key: keyof typeof runtimeEnv) {
  const value = runtimeEnv[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  throw new Error(`Missing required public environment variable: ${key}`);
}

export const publicEnv = {
  siteUrl: ensureTrailingSlash(readPublicEnv("VITE_SITE_URL")),
  clerkPublishableKey: readPublicEnv("VITE_CLERK_PUBLISHABLE_KEY"),
} as const;
