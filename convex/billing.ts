import { Polar } from "@convex-dev/polar";
import { components } from "./_generated/api";
import { query, internalQuery, action } from "./_generated/server";
import { v } from "convex/values";
import { PLAN_LIMITS } from "../lib/constants";

// Helper function to get user info from Clerk identity
async function getUserInfoFromIdentity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  generateCheckoutLink,
  generateCustomerPortalUrl,
  changeCurrentSubscription,
  cancelCurrentSubscription,
  listAllProducts,
} = polar.api();

// Type for subscription info
export type SubscriptionInfo = {
  plan: "free" | "pro" | "pro-yearly";
  is_active: boolean;
  plan_properties: {
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
        plan_properties: {
          images_limit: PLAN_LIMITS.FREE.IMAGES
        },
      };
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: identity.subject, // Clerk subject as userId
    });

    if (!subscription) {
      return {
        plan: "free",
        is_active: false,
        plan_properties: {
          images_limit: PLAN_LIMITS.FREE.IMAGES
        },
      };
    }

    const isYearly = subscription.productKey === "premiumYearly";
    return {
      plan: isYearly ? "pro-yearly" : "pro",
      is_active: subscription.status === "active",
      plan_properties: {
        images_limit: isYearly ? PLAN_LIMITS.PRO_YEARLY.IMAGES : PLAN_LIMITS.PRO.IMAGES,
      },
    };
  },
});

// Internal query to get subscription for a specific user (by user_id)
// This is used internally to check website owner's limits for public API
export const getSubscriptionByUserId = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<SubscriptionInfo> => {
    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: args.userId,
    });

    if (!subscription) {
      return {
        plan: "free",
        is_active: false,
        plan_properties: {
          images_limit: PLAN_LIMITS.FREE.IMAGES
        },
      };
    }

    const isYearly = subscription.productKey === "premiumYearly";
    return {
      plan: isYearly ? "pro-yearly" : "pro",
      is_active: subscription.status === "active",
      plan_properties: {
        images_limit: isYearly ? PLAN_LIMITS.PRO_YEARLY.IMAGES : PLAN_LIMITS.PRO.IMAGES,
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

// Helper function to find existing customer by email in Polar
async function findCustomerByEmail(email: string): Promise<string | null> {
  const { Polar } = await import("@polar-sh/sdk");

  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
    server: (process.env.POLAR_SERVER ?? "sandbox") as "sandbox" | "production",
  });

  // Search through customers using async iterator
  try {
    const iterator = await polar.customers.list({ limit: 100 });
    let count = 0;
    const maxPages = 20;

    for await (const page of iterator) {
      // @ts-expect-error - Polar SDK typing is incomplete for async iterator
      const items = page.items || page || [];
      if (Array.isArray(items)) {
        const customer = items.find((c: { email?: string }) => c.email?.toLowerCase() === email.toLowerCase());
        if (customer) {
          return customer.id;
        }
      }

      count++;
      if (count >= maxPages) break;
    }
  } catch (e) {
    console.error("[findCustomerByEmail] Error:", e);
  }

  return null;
}

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
    const dbCustomer = await ctx.runQuery(
      components.polar.lib.getCustomerByUserId,
      { userId }
    );

    // Initialize Polar SDK
    const { Polar } = await import("@polar-sh/sdk");
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
      server: (process.env.POLAR_SERVER ?? "sandbox") as "sandbox" | "production",
    });

    // Create or get customer
    const createOrGetCustomer = async (): Promise<string> => {
      if (dbCustomer?.id) {
        return dbCustomer.id;
      }

      // Try to find existing customer in Polar
      const existingCustomerId = await findCustomerByEmail(email);
      if (existingCustomerId) {
        // Link to local DB
        await ctx.runMutation(components.polar.lib.insertCustomer, {
          id: existingCustomerId,
          userId,
        });
        return existingCustomerId;
      }

      // Create new customer
      try {
        const customer = await polar.customers.create({
          email,
          metadata: { userId },
        });
        if (!customer.id) {
          throw new Error("Customer not created");
        }

        // Link to local DB
        await ctx.runMutation(components.polar.lib.insertCustomer, {
          id: customer.id,
          userId,
        });

        return customer.id;
      } catch (error: unknown) {
        // If customer already exists (race condition or search missed it), try to find again
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes("already exists") || errorMsg.includes("email")) {
          const retryCustomerId = await findCustomerByEmail(email);
          if (retryCustomerId) {
            await ctx.runMutation(components.polar.lib.insertCustomer, {
              id: retryCustomerId,
              userId,
            });
            return retryCustomerId;
          }
        }
        throw error;
      }
    };

    const customerId = await createOrGetCustomer();

    // Create checkout with existing customer
    const checkout = await polar.checkouts.create({
      products: args.productIds,
      allowDiscountCodes: true,
      customerId,
      successUrl: args.successUrl,
      embedOrigin: args.origin ?? args.successUrl,
    });

    return { url: checkout.url };
  },
});
