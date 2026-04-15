import { v } from "convex/values";
import { PLAN_LIMITS } from "../src/lib/constants";

export type SubscriptionInfo = {
  plan: "free" | "pro" | "pro-yearly";
  is_active: boolean;
  plan_properties: {
    images_limit: number;
  };
};

export type CheckoutPlan = "pro" | "pro-yearly";

export const checkoutPlanValidator = v.union(
  v.literal("pro"),
  v.literal("pro-yearly"),
);

const checkoutProductEnvByPlan = {
  pro: "POLAR_PREMIUM_MONTHLY_PRODUCT_ID",
  "pro-yearly": "POLAR_PREMIUM_YEARLY_PRODUCT_ID",
} as const satisfies Record<CheckoutPlan, string>;

export function getCheckoutProductId(plan: CheckoutPlan) {
  const envKey = checkoutProductEnvByPlan[plan];
  const productId = process.env[envKey];

  if (!productId) {
    throw new Error(`Missing ${envKey} for ${plan} checkout`);
  }

  return productId;
}

export function getFreeSubscriptionInfo(): SubscriptionInfo {
  return {
    plan: "free",
    is_active: false,
    plan_properties: {
      images_limit: PLAN_LIMITS.FREE.IMAGES,
    },
  };
}

export function buildSubscriptionInfo(
  subscription:
    | {
        productKey?: string;
        status?: string;
      }
    | null,
): SubscriptionInfo {
  if (!subscription?.productKey || !subscription.status) {
    return getFreeSubscriptionInfo();
  }

  const isYearly = subscription.productKey === "premiumYearly";

  return {
    plan: isYearly ? "pro-yearly" : "pro",
    is_active: subscription.status === "active",
    plan_properties: {
      images_limit: isYearly
        ? PLAN_LIMITS.PRO_YEARLY.IMAGES
        : PLAN_LIMITS.PRO.IMAGES,
    },
  };
}
