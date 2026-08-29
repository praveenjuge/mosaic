export const author_name = "Praveen Juge";
export const author_email = "hello@praveenjuge.com";
export const website_name = "Mosaic";
export const website_subtitle = "Simplify Your Open Graph Image Creation.";

export const website_description =
  "Transform your website's Open Graph social images by automating the process using screenshots. Say goodbye to the hassle of designing OG images for every page — let your beautiful website do the talking.";

export const PLAN_IMAGE_LIMITS = {
  free: 500,
  pro: 5_000,
  "pro-yearly": 999_999,
} as const;

export type BillingPlan = keyof typeof PLAN_IMAGE_LIMITS;
export const DEFAULT_BILLING_PLAN: BillingPlan = "free";
export const IMAGES_LIMIT = PLAN_IMAGE_LIMITS[DEFAULT_BILLING_PLAN];

export function getPlanImageLimit(plan: string | null | undefined): number {
  return PLAN_IMAGE_LIMITS[plan as BillingPlan] ?? IMAGES_LIMIT;
}

/** Maximum anonymous demo screenshots generated across the service per UTC day. */
export const DEMO_DAILY_GENERATION_LIMIT = 100;

/** Maximum demo screenshots generated for one client per UTC day. */
export const DEMO_CLIENT_DAILY_GENERATION_LIMIT = 10;
