export type PlanType = "free" | "pro" | "pro-yearly";

export interface PlanInfo {
  images: number;
  images_display: string;
  websites: string;
  support: string;
}

export interface Plan {
  name: string;
  description: string;
  price: string;
  period: string;
  badge: string | null;
  planType: PlanType;
}

// Landing page display limits (cosmetic only — not enforced)
const LANDING_PAGE_LIMITS = {
  FREE: 500,
  PRO: 5000,
  PRO_YEARLY: 999999,
} as const;

function formatPlanLimit(limit: number): string {
  return limit >= 999999
    ? "Unlimited OG Images"
    : `${limit.toLocaleString()} OG Images`;
}

export const PLANS: Record<PlanType, PlanInfo> = {
  free: {
    images: LANDING_PAGE_LIMITS.FREE,
    images_display: formatPlanLimit(LANDING_PAGE_LIMITS.FREE),
    websites: "Unlimited Websites",
    support: "Community Forum Support",
  },
  pro: {
    images: LANDING_PAGE_LIMITS.PRO,
    images_display: formatPlanLimit(LANDING_PAGE_LIMITS.PRO),
    websites: "Unlimited Websites",
    support: "Priority Email Support",
  },
  "pro-yearly": {
    images: LANDING_PAGE_LIMITS.PRO_YEARLY,
    images_display: formatPlanLimit(LANDING_PAGE_LIMITS.PRO_YEARLY),
    websites: "Unlimited Websites",
    support: "Priority Email Support",
  },
} as const;

export const PRICING_PLANS: Plan[] = [
  {
    name: "Free",
    description: "Perfect for Getting Started",
    price: "$0",
    period: "",
    badge: null,
    planType: "free",
  },
  {
    name: "Pro",
    description: "For Growing Teams",
    price: "$19",
    period: "/month",
    badge: "Popular",
    planType: "pro",
  },
  {
    name: "Pro Yearly",
    description: "Best Value - Save $29",
    price: "$199",
    period: "/year",
    badge: "Save $29/year",
    planType: "pro-yearly",
  },
] as const;

// Display names for plans
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  "pro-yearly": "Pro Yearly",
} as const;
