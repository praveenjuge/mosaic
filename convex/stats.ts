import { query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { PLAN_LIMITS } from "./constants";
import type { SubscriptionInfo } from "./billing";
import type { Id } from "./_generated/dataModel";

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
  websites: Array<{
    _id: Id<"sites">;
    url_base: string;
    _creationTime: number;
  }>;
  screenshot_counts: Record<string, number>;
  latest_screenshots: Array<{
    id: Id<"screenshots">;
    screenshot_url: string;
    size_in_bytes: number;
    generated_at: number;
    page_url: string;
    website_name: string | null;
  }>;
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
        websites: [],
        screenshot_counts: {},
        latest_screenshots: [],
      };
    }

    const userId = identity.subject;

    // Fetch all data in parallel
    const [sites, screenshots, subscription] = await Promise.all([
      ctx.db
        .query("sites")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .collect(),
      ctx.db
        .query("screenshots")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .order("desc")
        .collect(),
      ctx.runQuery(internal.billing.getSubscriptionByUserId, { userId }),
    ]);

    const totalImages = screenshots.length;
    const totalStorageBytes = screenshots.reduce(
      (sum, shot) => sum + (shot.size_in_bytes ?? 0),
      0,
    );
    const totalWebsites = sites.length;
    const plan = subscription.plan;
    const imagesLimit = subscription.plan_properties.images_limit;
    const hasExceededLimit = totalImages >= imagesLimit;

    // Prepare websites array (sorted by creation time, newest first)
    const websites = sites
      .map((site) => ({
        _id: site._id,
        url_base: site.url_base,
        _creationTime: site._creationTime,
      }))
      .sort((a, b) => b._creationTime - a._creationTime);

    // Calculate screenshot counts per website
    const screenshot_counts: Record<string, number> = {};
    for (const websiteId of websites.map((w) => w._id)) {
      const count = screenshots.filter(
        (s) => s.website_id === websiteId,
      ).length;
      screenshot_counts[websiteId] = count;
    }

    // Get latest 10 screenshots with website names
    const latest_screenshots = screenshots.slice(0, 10).map((screenshot) => {
      const website = sites.find((s) => s._id === screenshot.website_id);
      return {
        id: screenshot._id,
        screenshot_url: screenshot.screenshot_url,
        size_in_bytes: screenshot.size_in_bytes ?? 0,
        generated_at: screenshot._creationTime,
        page_url: screenshot.full_url,
        website_name: website?.url_base ?? null,
      };
    });

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
      websites,
      screenshot_counts,
      latest_screenshots,
    };
  },
});
