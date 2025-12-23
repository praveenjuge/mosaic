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
