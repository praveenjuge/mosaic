import { internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { IMAGES_LIMIT } from "../src/lib/constants";
import { formatDate, formatLimit, formatNumber } from "../src/lib/format";
import type { DashboardStats, QuotaStatus } from "../src/lib/types";
import { buildPublicImageUrl, buildSiteOgImageUrl } from "../src/lib/platform";
import { cleanDisplayUrl } from "../src/lib/url";

export type { DashboardStats, QuotaStatus } from "../src/lib/types";

export const getUserQuotaStatusInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<QuotaStatus> => {
    const sites = await ctx.db
      .query("sites")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .collect();

    const used = sites.reduce((sum, site) => sum + (site.image_count ?? 0), 0);
    const hasExceededLimit = used >= IMAGES_LIMIT;

    return {
      canGenerateMore: !hasExceededLimit,
      used,
      limit: IMAGES_LIMIT,
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
        limit: IMAGES_LIMIT,
        hasExceededLimit: false,
      };
    }

    return await ctx.runQuery(internal.stats.getUserQuotaStatusInternal, {
      userId: identity.subject,
    });
  },
});

function getEmptyDashboardStats(): DashboardStats {
  return {
    total_websites: 0,
    total_websites_display: "0",
    total_images: 0,
    total_images_display: "0",
    images_limit: IMAGES_LIMIT,
    images_limit_display: formatNumber(IMAGES_LIMIT),
    can_generate_more: false,
    has_exceeded_limit: false,
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

    const sites = await ctx.db
      .query("sites")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .collect();

    const totalImages = sites.reduce(
      (sum, site) => sum + (site.image_count ?? 0),
      0,
    );
    const totalWebsites = sites.length;
    const hasExceededLimit = totalImages >= IMAGES_LIMIT;

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
      can_generate_more: !hasExceededLimit,
      has_exceeded_limit: hasExceededLimit,
      images_limit: IMAGES_LIMIT,
      images_limit_display: formatLimit(IMAGES_LIMIT),
      websites,
      screenshot_counts,
      latest_screenshots,
    };
  },
});
