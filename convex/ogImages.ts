import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { extractUrlParts, normalizeUrlBase } from "../src/lib/url";
import { IMAGES_LIMIT } from "../src/lib/constants";

type SiteCandidate = {
  siteId: Id<"sites">;
  userId: string;
  url_base: string;
  r2Prefix: string;
};

type SiteSummary = Omit<SiteCandidate, "userId">;

export const getSitesForUrlBase = query({
  args: {
    urlBase: v.string(),
  },
  handler: async (ctx, args): Promise<{
    sites: SiteSummary[];
    selectedSite: SiteSummary | null;
  }> => {
    const normalizedUrlBase = normalizeUrlBase(args.urlBase);

    const matchingSites = await ctx.db
      .query("sites")
      .withIndex("by_url_base", (q) => q.eq("url_base", normalizedUrlBase))
      .collect();

    if (!matchingSites.length) {
      return { sites: [], selectedSite: null };
    }

    const sortedSites = matchingSites
      .slice()
      .sort((a, b) => a._creationTime - b._creationTime);

    const siteCandidates: SiteCandidate[] = sortedSites.map((site) => ({
      siteId: site._id,
      userId: site.user_id,
      url_base: site.url_base,
      r2Prefix: site.r2_prefix ?? site._id,
    }));

    const userImageCounts = new Map<string, number>();
    const getUserImageCount = async (userId: string) => {
      if (userImageCounts.has(userId)) {
        return userImageCounts.get(userId) ?? 0;
      }
      const userSites = await ctx.db
        .query("sites")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .collect();
      const count = userSites.reduce(
        (sum, site) => sum + (site.image_count ?? 0),
        0,
      );
      userImageCounts.set(userId, count);
      return count;
    };

    // Select the first site whose owner hasn't exceeded the global limit
    let selectedSite: SiteCandidate | null = null;
    for (const site of siteCandidates) {
      const used = await getUserImageCount(site.userId);
      if (used < IMAGES_LIMIT) {
        selectedSite = site;
        break;
      }
    }

    const sites: SiteSummary[] = siteCandidates.map(
      ({ siteId, url_base, r2Prefix }) => ({
        siteId,
        url_base,
        r2Prefix,
      }),
    );
    const selectedSiteSummary = selectedSite
      ? {
        siteId: selectedSite.siteId,
        url_base: selectedSite.url_base,
        r2Prefix: selectedSite.r2Prefix,
      }
      : null;

    return { sites, selectedSite: selectedSiteSummary };
  },
});

export const storeImageForSite = mutation({
  args: {
    siteId: v.id("sites"),
    pageUrl: v.string(),
    imageSize: v.number(),
    imageKey: v.string(),
    isNew: v.boolean(),
  },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      return {
        status: "error" as const,
        message: "Website not found.",
      };
    }

    const { sanitizedUrl } = extractUrlParts(args.pageUrl);
    const now = Date.now();
    const nextLatest = [
      {
        key: args.imageKey,
        page_url: sanitizedUrl,
        size_in_bytes: args.imageSize,
        generated_at: now,
      },
      ...(site.latest_images ?? []).filter(
        (image) => image.key !== args.imageKey,
      ),
    ].slice(0, 10);

    const patch: {
      latest_images: typeof nextLatest;
      image_count?: number;
    } = {
      latest_images: nextLatest,
    };
    if (args.isNew) {
      patch.image_count = (site.image_count ?? 0) + 1;
    }

    await ctx.db.patch(site._id, patch);

    return { status: "success" as const };
  },
});
