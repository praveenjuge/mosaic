import { PLAN_LIMITS } from "@/lib/constants";

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

function formatPlanLimit(limit: number): string {
  return limit >= 999999
    ? "Unlimited OG Images"
    : `${limit.toLocaleString()} OG Images`;
}

export const PLANS: Record<PlanType, PlanInfo> = {
  free: {
    images: PLAN_LIMITS.FREE.IMAGES,
    images_display: formatPlanLimit(PLAN_LIMITS.FREE.IMAGES),
    websites: "Unlimited Websites",
    support: "Community Forum Support",
  },
  pro: {
    images: PLAN_LIMITS.PRO.IMAGES,
    images_display: formatPlanLimit(PLAN_LIMITS.PRO.IMAGES),
    websites: "Unlimited Websites",
    support: "Priority Email Support",
  },
  "pro-yearly": {
    images: PLAN_LIMITS.PRO_YEARLY.IMAGES,
    images_display: formatPlanLimit(PLAN_LIMITS.PRO_YEARLY.IMAGES),
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
