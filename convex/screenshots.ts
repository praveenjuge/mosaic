import { query } from "./_generated/server";
import { v } from "convex/values";

const clampPositive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

export const listLatestForWebsite = query({
  args: {
    websiteId: v.id("sites"),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { data: [], hasMore: false };
    }

    const pageNumber = clampPositive(args.page ?? 1, 1);
    const limit = clampPositive(args.limit ?? 10, 10);

    const site = await ctx.db.get(args.websiteId);

    if (!site || site.user_id !== identity.subject) {
      return { data: [], hasMore: false };
    }

    const fetchPage = async (websiteId: string | typeof args.websiteId) => {
      let cursor: string | null = null;
      let pageResult;
      for (let i = 1; i <= pageNumber; i += 1) {
        pageResult = await ctx.db
          .query("screenshots")
          .withIndex("by_user_id_website_id_generated_at", (q) =>
            q.eq("user_id", identity.subject).eq("website_id", websiteId),
          )
          .order("desc")
          .paginate({ cursor, numItems: limit });
        cursor = pageResult.continueCursor;
        if (pageResult.isDone) break;
      }
      return pageResult;
    };

    let pageResult = await fetchPage(args.websiteId);
    if ((!pageResult || pageResult.page.length === 0) && site.id) {
      pageResult = await fetchPage(site.id);
    }

    const pageItems = pageResult?.page ?? [];

    const pageCache = new Map();
    const data = [];

    for (const screenshot of pageItems) {
      let page = pageCache.get(screenshot.page_id);
      if (page === undefined) {
        if (typeof screenshot.page_id === "string") {
          page = await ctx.db
            .query("pages")
            .withIndex("by_legacy_id", (q) => q.eq("id", screenshot.page_id))
            .unique();
        } else {
          page = await ctx.db.get(screenshot.page_id);
        }
        pageCache.set(screenshot.page_id, page);
      }

      data.push({
        id: screenshot._id,
        screenshot_url: screenshot.screenshot_url,
        size_in_bytes: screenshot.size_in_bytes ?? 0,
        generated_at: screenshot.generated_at,
        page_title: null,
        page_url: page?.full_url ?? "",
        website_name: site.url_base,
      });
    }

    return { data, hasMore: !(pageResult?.isDone ?? true) };
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

    const pageCache = new Map();
    const siteCache = new Map();
    const data = [];

    for (const screenshot of screenshots) {
      let page = pageCache.get(screenshot.page_id);
      if (page === undefined) {
        if (typeof screenshot.page_id === "string") {
          page = await ctx.db
            .query("pages")
            .withIndex("by_legacy_id", (q) => q.eq("id", screenshot.page_id))
            .unique();
        } else {
          page = await ctx.db.get(screenshot.page_id);
        }
        pageCache.set(screenshot.page_id, page);
      }

      let site = siteCache.get(screenshot.website_id);
      if (site === undefined) {
        if (typeof screenshot.website_id === "string") {
          site = await ctx.db
            .query("sites")
            .withIndex("by_legacy_id", (q) =>
              q.eq("id", screenshot.website_id),
            )
            .unique();
        } else {
          site = await ctx.db.get(screenshot.website_id);
        }
        siteCache.set(screenshot.website_id, site);
      }

      data.push({
        id: screenshot._id,
        screenshot_url: screenshot.screenshot_url,
        size_in_bytes: screenshot.size_in_bytes ?? 0,
        generated_at: screenshot.generated_at,
        page_title: null,
        page_url: page?.full_url ?? "",
        website_name: site?.url_base ?? "Unknown",
      });
    }

    return data;
  },
});
