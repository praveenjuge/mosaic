type PublicEnvValue = string | boolean | undefined;

const runtimeEnv = import.meta.env as Record<string, PublicEnvValue>;

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

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
}

export const publicEnv = {
  siteUrl: normalizeSiteUrl(
    readPublicEnv(
      ["VITE_SITE_URL"],
      runtimeEnv.DEV ? "http://localhost:3000/" : "https://mosaicimg.com/",
    ),
  ),
  convexUrl: readPublicEnv(["VITE_CONVEX_URL"]),
  clerkPublishableKey: readPublicEnv(["VITE_CLERK_PUBLISHABLE_KEY"], ""),
  polarPremiumMonthlyProductId: readPublicEnv(
    ["VITE_POLAR_PREMIUM_MONTHLY_PRODUCT_ID"],
    "",
  ),
  polarPremiumYearlyProductId: readPublicEnv(
    ["VITE_POLAR_PREMIUM_YEARLY_PRODUCT_ID"],
    "",
  ),
} as const;
