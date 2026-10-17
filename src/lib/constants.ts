export const author_name = "Praveen Juge";
export const website_name = "Mosaic";
export const website_subtitle = "Simplify Your Open Graph Image Creation.";

export const website_description =
  "Transform your website's Open Graph social images by automating the process using screenshots. Say goodbye to the hassle of designing OG images for every page — let your beautiful website do the talking.";

/** Shared images are regenerated after 30 days. */
export const GLOBAL_IMAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Maximum fresh screenshots per UTC day, across the service (`global`) and
 * for one client IP (`client`). Demo covers the anonymous home page demo.
 */
export const DAILY_GENERATION_LIMITS = {
  production: { global: 500, client: 50 },
  demo: { global: 100, client: 10 },
} as const;

/**
 * Browser Run engine for every OG screenshot (production and demo). Kitesurf
 * is cheaper and free while in beta, but it is not pixel-perfect and has no
 * WebGL or video; set this to "chromium" to go back to full Chrome rendering.
 *
 * @see https://developers.cloudflare.com/browser-run/kitesurf/
 */
export const SCREENSHOT_ENGINE: "chromium" | "kitesurf" = "kitesurf";
