import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

const createPageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `page_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const getById = query({
  args: {
    pageId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const page = await ctx.db
      .query("pages")
      .withIndex("by_page_id", (q) => q.eq("id", args.pageId))
      .unique();

    if (!page || page.user_id !== identity.subject) {
      return null;
    }

    return page;
  },
});

export const getOrCreate = mutation({
  args: {
    websiteId: v.string(),
    path: v.string(),
    fullUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to create pages.");
    }

    const site = await ctx.db
      .query("sites")
      .withIndex("by_site_id", (q) => q.eq("id", args.websiteId))
      .unique();

    if (!site || site.user_id !== identity.subject) {
      throw new Error("Website not found or access denied.");
    }

    const existingPage = await ctx.db
      .query("pages")
      .withIndex("by_website_id_path", (q) =>
        q.eq("website_id", args.websiteId).eq("path", args.path),
      )
      .unique();

    if (existingPage) {
      return existingPage;
    }

    const timestamp = nowIso();
    const page = {
      id: createPageId(),
      website_id: args.websiteId,
      user_id: identity.subject,
      path: args.path,
      full_url: args.fullUrl,
      created_at: timestamp,
      updated_at: timestamp,
    };

    await ctx.db.insert("pages", page);

    return page;
  },
});
