import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const clampPositive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

export const listLatestForWebsite = query({
  args: {
    websiteId: v.id("sites"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { data: [], cursor: null, hasMore: false };
    }

    const limit = clampPositive(args.limit ?? 10, 10);

    const site = await ctx.db.get(args.websiteId);

    if (!site || site.user_id !== identity.subject) {
      return { data: [], cursor: null, hasMore: false };
    }

    const pageResult = await ctx.db
      .query("screenshots")
      .withIndex("by_user_id_website_id", (q) =>
        q.eq("user_id", identity.subject).eq("website_id", args.websiteId),
      )
      .order("desc")
      .paginate({ cursor: args.cursor ?? null, numItems: limit });

    const data = pageResult.page.map((screenshot) => ({
      id: screenshot._id,
      screenshot_url: screenshot.screenshot_url,
      size_in_bytes: screenshot.size_in_bytes ?? 0,
      generated_at: screenshot._creationTime,
      page_title: null,
      page_url: screenshot.full_url,
      website_name: site.url_base,
    }));

    return {
      data,
      cursor: pageResult.continueCursor ?? null,
      hasMore: !pageResult.isDone,
    };
  },
});

export const listLatestForUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const limit = clampPositive(args.limit ?? 10, 10);

    const screenshots = await ctx.db
      .query("screenshots")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .order("desc")
      .take(limit);

    const websiteCache = new Map<Id<"sites">, string | null>();
    const websiteNameFor = async (websiteId: Id<"sites">) => {
      if (websiteCache.has(websiteId)) {
        return websiteCache.get(websiteId) ?? null;
      }
      const site = await ctx.db.get(websiteId);
      const name = site?.url_base ?? null;
      websiteCache.set(websiteId, name);
      return name;
    };

    const items = [];
    for (const screenshot of screenshots) {
      const websiteName = await websiteNameFor(screenshot.website_id);
      items.push({
        id: screenshot._id,
        screenshot_url: screenshot.screenshot_url,
        size_in_bytes: screenshot.size_in_bytes ?? 0,
        generated_at: screenshot._creationTime,
        page_title: null,
        page_url: screenshot.full_url,
        website_name: websiteName,
      });
    }

    return items;
  },
});

export const countForWebsites = query({
  args: {
    websiteIds: v.array(v.id("sites")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {};
    }

    const counts: Record<string, number> = {};

    for (const websiteId of args.websiteIds) {
      const screenshots = await ctx.db
        .query("screenshots")
        .withIndex("by_user_id_website_id", (q) =>
          q.eq("user_id", identity.subject).eq("website_id", websiteId),
        )
        .collect();

      counts[websiteId] = screenshots.length;
    }

    return counts;
  },
});
