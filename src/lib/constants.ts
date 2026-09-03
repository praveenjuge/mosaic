export const author_name = "Praveen Juge";
export const author_email = "hello@praveenjuge.com";
export const website_name = "Mosaic";
export const website_subtitle = "Simplify Your Open Graph Image Creation.";

export const website_description =
  "Mosaic generates Open Graph images by screenshotting your pages. Add one meta tag. Images cache by URL and refresh after 30 days.";

/** Shared images are regenerated after 30 days. */
export const GLOBAL_IMAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Maximum fresh production screenshots generated across the service per day. */
export const PRODUCTION_DAILY_GENERATION_LIMIT = 500;

/** Maximum fresh production screenshots generated for one client per day. */
export const PRODUCTION_CLIENT_DAILY_GENERATION_LIMIT = 50;

/** Maximum anonymous demo screenshots generated across the service per UTC day. */
export const DEMO_DAILY_GENERATION_LIMIT = 100;

/** Maximum demo screenshots generated for one client per UTC day. */
export const DEMO_CLIENT_DAILY_GENERATION_LIMIT = 10;
