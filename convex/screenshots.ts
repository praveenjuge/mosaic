import { query } from "./_generated/server";
import { v } from "convex/values";

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
      .withIndex("by_user_id_website_id_generated_at", (q) =>
        q.eq("user_id", identity.subject).eq("website_id", args.websiteId),
      )
      .order("desc")
      .paginate({ cursor: args.cursor ?? null, numItems: limit });

    const data = pageResult.page.map((screenshot) => ({
      id: screenshot._id,
      screenshot_url: screenshot.screenshot_url,
      size_in_bytes: screenshot.size_in_bytes ?? 0,
      generated_at: screenshot.generated_at,
      page_title: null,
      page_url: screenshot.page_url,
      website_name: screenshot.website_name,
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
      .withIndex("by_user_id_generated_at", (q) =>
        q.eq("user_id", identity.subject),
      )
      .order("desc")
      .take(limit);

    return screenshots.map((screenshot) => ({
      id: screenshot._id,
      screenshot_url: screenshot.screenshot_url,
      size_in_bytes: screenshot.size_in_bytes ?? 0,
      generated_at: screenshot.generated_at,
      page_title: null,
      page_url: screenshot.page_url,
      website_name: screenshot.website_name,
    }));
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
        .withIndex("by_user_id_website_id_generated_at", (q) =>
          q.eq("user_id", identity.subject).eq("website_id", websiteId),
        )
        .collect();

      counts[websiteId] = screenshots.length;
    }

    return counts;
  },
});
