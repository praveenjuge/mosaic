import { Polar } from "@convex-dev/polar";
import { components, api } from "./_generated/api";
import { query, action } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get user info from Clerk identity
async function getUserInfoFromIdentity(
  ctx: any
): Promise<{ userId: string; email: string }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return {
    userId: identity.subject,
    email: identity.email ?? "",
  };
}

// Query to get current user info - called by Polar component
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return getUserInfoFromIdentity(ctx);
  },
});

// Initialize Polar client
export const polar = new Polar(components.polar, {
  getUserInfo: getUserInfoFromIdentity,
  products: {
    premiumMonthly: process.env.POLAR_PREMIUM_MONTHLY_PRODUCT_ID!,
    premiumYearly: process.env.POLAR_PREMIUM_YEARLY_PRODUCT_ID!,
  },
});

// Export Polar API functions
export const {
  getConfiguredProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
  changeCurrentSubscription,
  cancelCurrentSubscription,
  listAllProducts,
} = polar.api();

// Type for subscription info
type SubscriptionInfo = {
  plan: "free" | "pro" | "pro-yearly";
  is_active: boolean;
  plan_properties: {
    websites_limit: number;
    images_limit: number;
  };
};

// Query to get subscription with plan details
export const getCurrentSubscription = query({
  args: {},
  handler: async (ctx): Promise<SubscriptionInfo> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        plan: "free",
        is_active: false,
        plan_properties: { websites_limit: 999999, images_limit: 500 },
      };
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: identity.subject, // Clerk subject as userId
    });

    if (!subscription) {
      return {
        plan: "free",
        is_active: false,
        plan_properties: { websites_limit: 999999, images_limit: 500 },
      };
    }

    const isYearly = subscription.productKey === "premiumYearly";
    return {
      plan: isYearly ? "pro-yearly" : "pro",
      is_active: subscription.status === "active",
      plan_properties: {
        websites_limit: 999999,
        images_limit: isYearly ? 999999 : 5000,
      },
    };
  },
});

// Sync products from Polar to Convex - run this once if products were created before using this component
export const syncProducts = action({
  args: {},
  handler: async (ctx) => {
    await polar.syncProducts(ctx);
  },
});

// Helper to manually link an existing Polar customer ID to the current user
// Use this if you already have a customer in Polar (created outside this component)
export const linkExistingCustomer = action({
  args: {
    polarCustomerId: v.string(),
    userId: v.string(), // Clerk user ID (identity.subject)
  },
  handler: async (ctx, args): Promise<{ success: boolean; customerId: string; action: string }> => {
    const userId = args.userId;

    // Check if customer already exists in Convex using component's internal query
    const existingCustomer = await ctx.runQuery(
      components.polar.lib.getCustomerByUserId,
      { userId }
    );

    if (existingCustomer) {
      console.log("Customer already linked:", existingCustomer.id);
      return { success: true, customerId: existingCustomer.id, action: "already_linked" };
    }

    // Insert the customer mapping using the component's internal mutation
    await ctx.runMutation(components.polar.lib.insertCustomer, {
      id: args.polarCustomerId,
      userId,
    });

    return { success: true, customerId: args.polarCustomerId, action: "linked" };
  },
});

// Custom checkout link generator that handles existing Polar customers
// If a customer with this email already exists in Polar, we'll link it automatically
export const createCheckoutLink = action({
  args: {
    productIds: v.array(v.string()),
    successUrl: v.string(),
    origin: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const { userId, email } = await getUserInfoFromIdentity(ctx);

    // Check if customer already exists in Convex
    let dbCustomer = await ctx.runQuery(
      components.polar.lib.getCustomerByUserId,
      { userId }
    );

    if (!dbCustomer) {
      // Try to find existing customer in Polar by email
      const { PolarCore } = await import("@polar-sh/sdk/core.js");
      const { customersList } = await import("@polar-sh/sdk/funcs/customersList.js");

      const polar = new PolarCore({
        accessToken: process.env.POLAR_ORGANIZATION_TOKEN ?? "",
        server: (process.env.POLAR_SERVER ?? "sandbox") as "sandbox" | "production",
      });

      // Search for customer by email
      let foundCustomerId: string | null = null;
      let page = 1;
      while (page <= 5 && !foundCustomerId) {
        try {
          const result = await customersList(polar, {
            page,
            limit: 100,
          });
          // @ts-ignore - Polar SDK types may not match exactly
          const items = result.value?.items || result.value || [];
          const customer = items.find((c: any) => c.email === email);
          if (customer) {
            foundCustomerId = customer.id;
          }
          // @ts-ignore
          if (!result.value?.pagination?.hasMore) break;
          page++;
        } catch {
          break;
        }
      }

      if (foundCustomerId) {
        // Link the existing customer
        await ctx.runMutation(components.polar.lib.insertCustomer, {
          id: foundCustomerId,
          userId,
        });
        dbCustomer = { id: foundCustomerId, userId };
      }
    }

    // Now create the checkout session
    return await ctx.runAction(api.billing.generateCheckoutLink, {
      ...args,
      origin: args.origin ?? args.successUrl,
    });
  },
});
