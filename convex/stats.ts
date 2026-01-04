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
      },
    );

    const plan = subscription.plan;
    const limit: number = subscription.plan_properties.images_limit;

    const sites = await ctx.db
      .query("sites")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .collect();

    const used = sites.reduce((sum, site) => sum + (site.image_count ?? 0), 0);
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
    id: string;
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

const PUBLIC_R2_BASE_URL = "https://og.mosaicimg.com/";
const getPublicImageUrl = (key: string) => `${PUBLIC_R2_BASE_URL}${key}`;

export const getUserDashboardStats = query({
  args: {},
  handler: async (ctx): Promise<DashboardStats> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        total_websites: 0,
        total_images: 0,
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
    const [sites, subscription] = await Promise.all([
      ctx.db
        .query("sites")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .collect(),
      ctx.runQuery(internal.billing.getSubscriptionByUserId, { userId }),
    ]);

    const totalImages = sites.reduce(
      (sum, site) => sum + (site.image_count ?? 0),
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
      const site = sites.find((s) => s._id === websiteId);
      screenshot_counts[websiteId] = site?.image_count ?? 0;
    }

    // Get latest 10 images across all sites
    const latest_screenshots = sites
      .flatMap((site) =>
        (site.latest_images ?? []).map((image) => ({
          id: image.key,
          screenshot_url: getPublicImageUrl(image.key),
          size_in_bytes: image.size_in_bytes,
          generated_at: image.generated_at,
          page_url: image.page_url,
          website_name: site.url_base ?? null,
        })),
      )
      .sort((a, b) => b.generated_at - a.generated_at)
      .slice(0, 10);

    return {
      total_websites: totalWebsites,
      total_images: totalImages,
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
