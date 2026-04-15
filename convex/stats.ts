import { internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { PLAN_LIMITS } from "../src/lib/constants";
import type { SubscriptionInfo } from "./billing";
import type { Id } from "./_generated/dataModel";
import { buildPublicImageUrl, buildSiteOgImageUrl } from "../src/lib/platform";
import { cleanDisplayUrl } from "../src/lib/url";

type QuotaStatus = {
  canGenerateMore: boolean;
  used: number;
  limit: number;
  plan: "free" | "pro" | "pro-yearly";
  isFreePlan: boolean;
  hasExceededLimit: boolean;
};

export const getUserQuotaStatusInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<QuotaStatus> => {
    const subscription: SubscriptionInfo = await ctx.runQuery(
      internal.billing.getSubscriptionByUserId,
      { userId: args.userId },
    );

    const plan = subscription.plan;
    const limit = subscription.plan_properties.images_limit;

    const sites = await ctx.db
      .query("sites")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .collect();

    const used = sites.reduce((sum, site) => sum + (site.image_count ?? 0), 0);
    const hasExceededLimit = used >= limit;

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
  total_websites_display: string;
  total_images: number;
  total_images_display: string;
  plan: "free" | "pro" | "pro-yearly";
  plan_display_name: string;
  is_active: boolean;
  can_generate_more: boolean;
  has_exceeded_limit: boolean;
  images_limit: number;
  images_limit_display: string;
  websites: Array<{
    _id: Id<"sites">;
    url_base: string;
    full_url: string;
    og_image_usage_url: string;
    favicon_url: string;
    _creationTime: number;
  }>;
  screenshot_counts: Record<string, number>;
  latest_screenshots: Array<{
    id: string;
    screenshot_url: string;
    size_in_bytes: number;
    generated_at: number;
    formatted_date: string;
    page_url: string;
    display_url: string;
    website_name: string | null;
  }>;
};

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  "pro-yearly": "Pro Yearly",
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
}

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

function formatLimit(limit: number): string {
  return limit >= 999999 ? "∞" : formatNumber(limit);
}

function getEmptyDashboardStats(): DashboardStats {
  return {
    total_websites: 0,
    total_websites_display: "0",
    total_images: 0,
    total_images_display: "0",
    plan: "free",
    plan_display_name: PLAN_DISPLAY_NAMES.free,
    is_active: false,
    can_generate_more: false,
    has_exceeded_limit: false,
    images_limit: PLAN_LIMITS.FREE.IMAGES,
    images_limit_display: formatNumber(PLAN_LIMITS.FREE.IMAGES),
    websites: [],
    screenshot_counts: {},
    latest_screenshots: [],
  };
}

export const getUserDashboardStats = query({
  args: {},
  handler: async (ctx): Promise<DashboardStats> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return getEmptyDashboardStats();
    }

    const userId = identity.subject;

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

    const websites = sites
      .map((site) => {
        const fullUrl = `https://${site.url_base}`;
        return {
          _id: site._id,
          url_base: site.url_base,
          full_url: fullUrl,
          og_image_usage_url: buildSiteOgImageUrl("https://mosaicimg.com/", fullUrl),
          favicon_url: `https://www.google.com/s2/favicons?domain=${fullUrl}&sz=64`,
          _creationTime: site._creationTime,
        };
      })
      .sort((a, b) => b._creationTime - a._creationTime);

    const screenshot_counts: Record<string, number> = sites.reduce(
      (acc, site) => {
        acc[site._id] = site.image_count ?? 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    const latest_screenshots = sites
      .flatMap((site) =>
        (site.latest_images ?? []).map((image) => {
          const pageUrl = image.page_url.replace(/\/+$/, "");
          return {
            id: image.key,
            screenshot_url: buildPublicImageUrl(image.key),
            size_in_bytes: image.size_in_bytes,
            generated_at: image.generated_at,
            formatted_date: formatDate(image.generated_at),
            page_url: pageUrl,
            display_url: cleanDisplayUrl(pageUrl),
            website_name: site.url_base ?? null,
          };
        }),
      )
      .sort((a, b) => b.generated_at - a.generated_at)
      .slice(0, 10);

    return {
      total_websites: totalWebsites,
      total_websites_display: formatNumber(totalWebsites),
      total_images: totalImages,
      total_images_display: formatNumber(totalImages),
      plan,
      plan_display_name: PLAN_DISPLAY_NAMES[plan] ?? PLAN_DISPLAY_NAMES.free,
      is_active: subscription.is_active,
      can_generate_more: !hasExceededLimit,
      has_exceeded_limit: hasExceededLimit,
      images_limit: imagesLimit,
      images_limit_display: formatLimit(imagesLimit),
      websites,
      screenshot_counts,
      latest_screenshots,
    };
  },
});

// getPlanInfo query removed - now using static config in lib/pricing.ts
