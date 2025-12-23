import { query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { PLAN_LIMITS } from "./constants";
import type { SubscriptionInfo } from "./billing";

type QuotaStatus = {
  canGenerateMore: boolean;
  used: number;
  limit: number;
  plan: "free" | "pro" | "pro-yearly";
  isFreePlan: boolean;
  hasExceededLimit: boolean;
};

// Internal query to get quota status for a specific user
export const getUserQuotaStatusInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<QuotaStatus> => {
    // Get current subscription/plan using the existing billing internal query
    const subscription: SubscriptionInfo = await ctx.runQuery(
      internal.billing.getSubscriptionByUserId,
      {
        userId: args.userId,
      }
    );

    const plan = subscription.plan;
    const limit: number = subscription.plan_properties.images_limit;

    // Count total images
    const screenshots = await ctx.db
      .query("screenshots")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .collect();

    const used = screenshots.length;
    const hasExceededLimit: boolean = used >= limit;

    return {
      canGenerateMore: !hasExceededLimit,
      used,
      limit,
      plan,
      isFreePlan: plan === "free",
      hasExceededLimit,
    };
  },
});

// Quota status for the current user
export const getUserQuotaStatus = query({
  args: {},
  handler: async (ctx): Promise<QuotaStatus> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        canGenerateMore: false,
        used: 0,
        limit: PLAN_LIMITS.FREE.IMAGES,
        plan: "free",
        isFreePlan: true,
        hasExceededLimit: false,
      };
    }

    return await ctx.runQuery(internal.stats.getUserQuotaStatusInternal, {
      userId: identity.subject,
    });
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        total_images: 0,
        total_storage_bytes: 0,
        total_websites: 0,
      };
    }

    const screenshots = await ctx.db
      .query("screenshots")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .collect();

    const totalImages = screenshots.length;
    const totalStorageBytes = screenshots.reduce(
      (sum, shot) => sum + (shot.size_in_bytes ?? 0),
      0,
    );
    const websites = await ctx.db
      .query("sites")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .collect();

    return {
      total_images: totalImages,
      total_storage_bytes: totalStorageBytes,
      total_websites: websites.length,
    };
  },
});

// Consolidated dashboard stats query - returns all dashboard data in a single request
export type DashboardStats = {
  total_websites: number;
  total_images: number;
  total_storage_bytes: number;
  plan: "free" | "pro" | "pro-yearly";
  plan_display_name: string;
  is_active: boolean;
  can_generate_more: boolean;
  has_exceeded_limit: boolean;
  images_limit: number;
};

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  "pro-yearly": "Pro Yearly",
};

export const getUserDashboardStats = query({
  args: {},
  handler: async (ctx): Promise<DashboardStats> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        total_websites: 0,
        total_images: 0,
        total_storage_bytes: 0,
        plan: "free",
        plan_display_name: PLAN_DISPLAY_NAMES.free,
        is_active: false,
        can_generate_more: false,
        has_exceeded_limit: false,
        images_limit: PLAN_LIMITS.FREE.IMAGES,
      };
    }

    const userId = identity.subject;

    // Fetch all data in parallel
    const [sites, screenshots, subscription] = await Promise.all([
      ctx.db.query("sites").withIndex("by_user_id", (q) => q.eq("user_id", userId)).collect(),
      ctx.db.query("screenshots").withIndex("by_user_id", (q) => q.eq("user_id", userId)).collect(),
      ctx.runQuery(internal.billing.getSubscriptionByUserId, { userId }),
    ]);

    const totalImages = screenshots.length;
    const totalStorageBytes = screenshots.reduce((sum, shot) => sum + (shot.size_in_bytes ?? 0), 0);
    const totalWebsites = sites.length;
    const plan = subscription.plan;
    const imagesLimit = subscription.plan_properties.images_limit;
    const hasExceededLimit = totalImages >= imagesLimit;

    return {
      total_websites: totalWebsites,
      total_images: totalImages,
      total_storage_bytes: totalStorageBytes,
      plan,
      plan_display_name: PLAN_DISPLAY_NAMES[plan] ?? PLAN_DISPLAY_NAMES.free,
      is_active: subscription.is_active,
      can_generate_more: !hasExceededLimit,
      has_exceeded_limit: hasExceededLimit,
      images_limit: imagesLimit,
    };
  },
});
