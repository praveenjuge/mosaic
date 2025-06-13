import { UserSubscriptionInfo } from "@/lib/types";
import { Polar } from "@polar-sh/sdk";
import { cache } from "react";

/**
 * Subscription and user limits operations
 */

const _getPolarCustomerState = cache(async (userId: string): Promise<unknown> => {
  try {
    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;

    if (!polarAccessToken) {
      console.error("POLAR_ACCESS_TOKEN not configured");
      return null;
    }

    const polar = new Polar({
      accessToken: polarAccessToken,
      server: process.env.NODE_ENV === 'development' ? "sandbox" : "production",
    });

    const response = await polar.customers.getStateExternal({
      externalId: userId,
    });

    return response || null;
  } catch (error: unknown) {
    // Handle 404 as customer not found (normal case)
    const errorObj = error as { statusCode?: number; status?: number };
    if (errorObj?.statusCode === 404 || errorObj?.status === 404) {
      return null;
    }

    console.error("Error fetching Polar customer state:", error);
    return null;
  }
});

async function _getUserSubscriptionInfo(userId: string | null): Promise<UserSubscriptionInfo> {
  try {
    if (!userId) {
      return {
        plan: "free",
        plan_properties: {
          websites_limit: 1,
          images_limit: 500,
        },
        is_active: false,
      };
    }

    const customerState = await _getPolarCustomerState(userId);
    const customerStateTyped = customerState as {
      activeSubscriptions?: Array<{
        status: string;
        cancelAtPeriodEnd?: boolean;
        productId?: string;
      }>;
    } | null;

    if (!customerStateTyped || !customerStateTyped.activeSubscriptions?.length) {
      return {
        plan: "free",
        plan_properties: {
          websites_limit: 1,
          images_limit: 500,
        },
        is_active: false,
      };
    }

    // Find active subscription
    const activeSubscription = customerStateTyped.activeSubscriptions?.find(
      (sub: { status: string; cancelAtPeriodEnd?: boolean }) => sub.status === "active" && !sub.cancelAtPeriodEnd
    );

    if (!activeSubscription) {
      return {
        plan: "free",
        plan_properties: {
          websites_limit: 1,
          images_limit: 500,
        },
        is_active: false,
      };
    }

    // Determine plan type based on product ID and interval
    const proYearlyProductId = process.env.POLAR_PRO_YEARLY_PRODUCT_ID;

    let planType = "pro";
    let planProperties;

    if (activeSubscription.productId === proYearlyProductId) {
      planType = "pro-yearly";
      planProperties = {
        websites_limit: 999999, // Unlimited for pro yearly
        images_limit: 999999,   // Unlimited for pro yearly
      };
    } else {
      planProperties = {
        websites_limit: 999999, // Unlimited for pro monthly
        images_limit: 5000,     // 5000 for pro monthly
      };
    }

    return {
      plan: planType,
      plan_properties: planProperties,
      is_active: true,
    };
  } catch (error) {
    console.error("Error in getUserSubscriptionInfo:", error);
    // Return safe defaults
    return {
      plan: "free",
      plan_properties: {
        websites_limit: 1,
        images_limit: 500,
      },
      is_active: false,
    };
  }
}

// Cached exports
export const getPolarCustomerState = _getPolarCustomerState;
export const getUserSubscriptionInfo = cache(_getUserSubscriptionInfo);