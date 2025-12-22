import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { extractUrlParts } from "./utils/url";

const nowTimestamp = () => Date.now();

export const getById = query({
  args: {
    pageId: v.id("pages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const page = await ctx.db.get(args.pageId);

    if (!page || page.user_id !== identity.subject) {
      return null;
    }

    return page;
  },
});

export const getOrCreate = mutation({
  args: {
    websiteId: v.id("sites"),
    path: v.string(),
    fullUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to create pages.");
    }

    const site = await ctx.db.get(args.websiteId);

    if (!site || site.user_id !== identity.subject) {
      throw new Error("Website not found or access denied.");
    }

    const { sanitizedUrl } = extractUrlParts(args.fullUrl);
    const existingPage = await ctx.db
      .query("pages")
      .withIndex("by_website_id_path", (q) =>
        q.eq("website_id", args.websiteId).eq("path", args.path),
      )
      .unique();

    if (existingPage) {
      return existingPage;
    }

    const timestamp = nowTimestamp();
    const page = {
      website_id: args.websiteId,
      user_id: identity.subject,
      path: args.path,
      full_url: sanitizedUrl,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const pageId = await ctx.db.insert("pages", page);

    return { ...page, _id: pageId };
  },
});
