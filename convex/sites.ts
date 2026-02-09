import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { normalizeUrlBase } from "./utils/url";
const generateR2Prefix = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const siteInput = v.object({
  url_base: v.string(),
});
export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const sites = await ctx.db
      .query("sites")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .collect();

    return sites.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const countForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const sites = await ctx.db
      .query("sites")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .collect();

    return sites.length;
  },
});

export const getById = query({
  args: {
    siteId: v.id("sites"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const site = await ctx.db.get(args.siteId);

    if (!site || site.user_id !== identity.subject) {
      return null;
    }

    return site;
  },
});

export const getByUrlBase = query({
  args: {
    url_base: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const normalizedUrl = normalizeUrlBase(args.url_base);
    return await ctx.db
      .query("sites")
      .withIndex("by_user_id_url_base", (q) =>
        q.eq("user_id", identity.subject).eq("url_base", normalizedUrl),
      )
      .unique();
  },
});

export const addSite = mutation({
  args: {
    url_base: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        status: "error" as const,
        message: "You must be logged in to add a website.",
      };
    }

    const normalizedUrl = normalizeUrlBase(args.url_base);
    const existing = await ctx.db
      .query("sites")
      .withIndex("by_user_id_url_base", (q) =>
        q.eq("user_id", identity.subject).eq("url_base", normalizedUrl),
      )
      .unique();

    if (existing) {
      return {
        status: "error" as const,
        message: "This website already exists in your list.",
      };
    }

    const site = {
      user_id: identity.subject,
      url_base: normalizedUrl,
      image_count: 0,
      r2_prefix: generateR2Prefix(),
      latest_images: [],
    };

    const siteId = await ctx.db.insert("sites", site);
    return {
      status: "success" as const,
      message: "Website added successfully",
      data: [{ ...site, _id: siteId }],
    };
  },
});

export const editSite = mutation({
  args: {
    siteId: v.id("sites"),
    url_base: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        status: "error" as const,
        message: "You must be logged in to edit a website.",
      };
    }

    const existing = await ctx.db.get(args.siteId);

    if (!existing || existing.user_id !== identity.subject) {
      return {
        status: "error" as const,
        message: "Website not found or access denied.",
      };
    }

    const normalizedUrl = normalizeUrlBase(args.url_base);
    const duplicate = await ctx.db
      .query("sites")
      .withIndex("by_user_id_url_base", (q) =>
        q.eq("user_id", identity.subject).eq("url_base", normalizedUrl),
      )
      .unique();

    if (duplicate && duplicate._id !== args.siteId) {
      return {
        status: "error" as const,
        message: "This website already exists in your list.",
      };
    }

    await ctx.db.patch(existing._id, {
      url_base: normalizedUrl,
    });

    return {
      status: "success" as const,
      message: "Website updated successfully",
      data: [
        {
          ...existing,
          url_base: normalizedUrl,
        },
      ],
    };
  },
});

export const deleteSite = action({
  args: {
    siteId: v.id("sites"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        status: "error" as const,
        message: "You must be logged in to delete a website.",
      };
    }

    const existing = await ctx.runQuery(api.sites.getById, { siteId: args.siteId });

    if (!existing) {
      return {
        status: "error" as const,
        message: "Website not found.",
      };
    }

    const legacyPrefix = `${existing.user_id}/${existing._id}/`;
    const prefixes = new Set<string>([
      legacyPrefix,
      `${existing._id}/`,
    ]);
    if (existing.r2_prefix) {
      prefixes.add(`${existing.r2_prefix}/`);
    }
    await Promise.all(
      [...prefixes].map((prefix) =>
        ctx.runAction(api.r2.deleteObjectsByPrefix, { prefix })
      )
    );

    await ctx.runMutation(api.sites.deleteSiteInternal, { siteId: args.siteId });
    return {
      status: "success" as const,
      message: "Website deleted successfully",
    };
  },
});

export const deleteSiteInternal = mutation({
  args: {
    siteId: v.id("sites"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to delete a website.");
    }

    const site = await ctx.db.get(args.siteId);
    if (!site || site.user_id !== identity.subject) {
      throw new Error("Website not found or access denied.");
    }

    await ctx.db.delete(args.siteId);
  },
});

export const importSites = mutation({
  args: {
    sites: v.array(siteInput),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to import websites.");
    }

    let inserted = 0;
    let updated = 0;

    for (const site of args.sites) {
      const normalizedUrl = normalizeUrlBase(site.url_base);
      const existing = await ctx.db
        .query("sites")
        .withIndex("by_user_id_url_base", (q) =>
          q.eq("user_id", identity.subject).eq("url_base", normalizedUrl),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          url_base: normalizedUrl,
        });
        updated += 1;
      } else {
        await ctx.db.insert("sites", {
          user_id: identity.subject,
          url_base: normalizedUrl,
          image_count: 0,
          r2_prefix: generateR2Prefix(),
          latest_images: [],
        });
        inserted += 1;
      }
    }

    return { inserted, updated };
  },
});
