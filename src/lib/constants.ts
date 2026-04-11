export const author_name = "Praveen Juge";
export const author_email = "hello@praveenjuge.com";
export const website_name = "Mosaic";
export const website_subtitle = "Simplify Your Open Graph Image Creation.";

export const website_description =
  "Transform your website's Open Graph social images by automating the process using screenshots. Say goodbye to the hassle of designing OG images for every page — let your beautiful website do the talking.";

// Plan limits
export const PLAN_LIMITS = {
  FREE: { IMAGES: 500 },
  PRO: { IMAGES: 5000 },
  PRO_YEARLY: { IMAGES: 999999 },
} as const;

// Error messages
export const LIMIT_MESSAGES = {
  IMAGES_LIMIT_EXCEEDED: "You've reached your OG image limit for this plan. Please upgrade to continue generating images.",
  FREE_LIMIT_ALERT: "You've exceeded the free plan limit of 500 OG images. Please upgrade your subscription to continue.",
} as const;

// Plan type mapping
export const PLAN_TYPE_MAPPING = {
  free: "FREE",
  pro: "PRO",
  "pro-yearly": "PRO_YEARLY",
} as const;
