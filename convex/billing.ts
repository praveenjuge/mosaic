import { Polar } from "@convex-dev/polar";
import { components } from "./_generated/api";
import { query, internalQuery, action } from "./_generated/server";
import { v } from "convex/values";
import {
  buildSubscriptionInfo,
  checkoutPlanValidator,
  getCheckoutProductId,
  type SubscriptionInfo,
} from "./billing.config";
import {
  createPolarSdkClient,
  findCustomerByEmail,
  getUserInfoFromIdentity,
} from "./billing.customers";

export type { SubscriptionInfo } from "./billing.config";

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

// Query to get subscription with plan details
export const getCurrentSubscription = query({
  args: {},
  handler: async (ctx): Promise<SubscriptionInfo> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return buildSubscriptionInfo(null);
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: identity.subject, // Clerk subject as userId
    });

    return buildSubscriptionInfo(subscription);
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

    return buildSubscriptionInfo(subscription);
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
    plan: checkoutPlanValidator,
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
    const polar = await createPolarSdkClient();

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
    const productId = getCheckoutProductId(args.plan);

    // Create checkout with existing customer
    const checkout = await polar.checkouts.create({
      products: [productId],
      allowDiscountCodes: true,
      customerId,
      successUrl: args.successUrl,
      embedOrigin: args.origin ?? args.successUrl,
    });

    return { url: checkout.url };
  },
});
