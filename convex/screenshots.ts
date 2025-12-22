import { query } from "./_generated/server";
import { v } from "convex/values";

const clampPositive = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

export const listLatestForWebsite = query({
  args: {
    websiteId: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { data: [], total: 0 };
    }

    const pageNumber = clampPositive(args.page ?? 1, 1);
    const limit = clampPositive(args.limit ?? 10, 10);
    const offset = (pageNumber - 1) * limit;

    const site = await ctx.db
      .query("sites")
      .withIndex("by_site_id", (q) => q.eq("id", args.websiteId))
      .unique();

    if (!site || site.user_id !== identity.subject) {
      return { data: [], total: 0 };
    }

    const allScreenshots = await ctx.db
      .query("screenshots")
      .withIndex("by_user_id_website_id_generated_at", (q) =>
        q.eq("user_id", identity.subject).eq("website_id", args.websiteId),
      )
      .order("desc")
      .collect();

    const total = allScreenshots.length;
    const pageItems = allScreenshots.slice(offset, offset + limit);

    const pageCache = new Map<string, { full_url?: string } | null>();
    const data = [];

    for (const screenshot of pageItems) {
      let page = pageCache.get(screenshot.page_id);
      if (page === undefined) {
        page = await ctx.db
          .query("pages")
          .withIndex("by_page_id", (q) => q.eq("id", screenshot.page_id))
          .unique();
        pageCache.set(screenshot.page_id, page);
      }

      data.push({
        id: screenshot.id,
        screenshot_url: screenshot.screenshot_url,
        size_in_bytes: screenshot.size_in_bytes ?? 0,
        generated_at: screenshot.generated_at,
        page_title: null,
        page_url: page?.full_url ?? "",
        website_name: site.url_base,
      });
    }

    return { data, total };
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

    const pageCache = new Map<string, { full_url?: string } | null>();
    const siteCache = new Map<string, { url_base?: string } | null>();
    const data = [];

    for (const screenshot of screenshots) {
      let page = pageCache.get(screenshot.page_id);
      if (page === undefined) {
        page = await ctx.db
          .query("pages")
          .withIndex("by_page_id", (q) => q.eq("id", screenshot.page_id))
          .unique();
        pageCache.set(screenshot.page_id, page);
      }

      let site = siteCache.get(screenshot.website_id);
      if (site === undefined) {
        site = await ctx.db
          .query("sites")
          .withIndex("by_site_id", (q) => q.eq("id", screenshot.website_id))
          .unique();
        siteCache.set(screenshot.website_id, site);
      }

      data.push({
        id: screenshot.id,
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
