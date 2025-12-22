import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const siteInput = v.object({
  id: v.string(),
  user_id: v.string(),
  url_base: v.string(),
  created_at: v.string(),
  updated_at: v.string(),
});

const createSiteId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `site_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const nowIso = () => new Date().toISOString();

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

    return sites.sort((a, b) => b.created_at.localeCompare(a.created_at));
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
    siteId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const site = await ctx.db
      .query("sites")
      .withIndex("by_site_id", (q) => q.eq("id", args.siteId))
      .unique();

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

    return await ctx.db
      .query("sites")
      .withIndex("by_user_id_url_base", (q) =>
        q.eq("user_id", identity.subject).eq("url_base", args.url_base),
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

    const existing = await ctx.db
      .query("sites")
      .withIndex("by_user_id_url_base", (q) =>
        q.eq("user_id", identity.subject).eq("url_base", args.url_base),
      )
      .unique();

    if (existing) {
      return {
        status: "error" as const,
        message: "This website already exists in your list.",
      };
    }

    const timestamp = nowIso();
    const site = {
      id: createSiteId(),
      user_id: identity.subject,
      url_base: args.url_base,
      created_at: timestamp,
      updated_at: timestamp,
    };

    await ctx.db.insert("sites", site);

    return {
      status: "success" as const,
      message: "Website added successfully",
      data: [site],
    };
  },
});

export const editSite = mutation({
  args: {
    siteId: v.string(),
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

    const existing = await ctx.db
      .query("sites")
      .withIndex("by_site_id", (q) => q.eq("id", args.siteId))
      .unique();

    if (!existing || existing.user_id !== identity.subject) {
      return {
        status: "error" as const,
        message: "Website not found or access denied.",
      };
    }

    const duplicate = await ctx.db
      .query("sites")
      .withIndex("by_user_id_url_base", (q) =>
        q.eq("user_id", identity.subject).eq("url_base", args.url_base),
      )
      .unique();

    if (duplicate && duplicate.id !== args.siteId) {
      return {
        status: "error" as const,
        message: "This website already exists in your list.",
      };
    }

    const timestamp = nowIso();
    await ctx.db.patch(existing._id, {
      url_base: args.url_base,
      updated_at: timestamp,
    });

    return {
      status: "success" as const,
      message: "Website updated successfully",
      data: [
        {
          id: existing.id,
          user_id: existing.user_id,
          url_base: args.url_base,
          created_at: existing.created_at,
          updated_at: timestamp,
        },
      ],
    };
  },
});

export const deleteSite = mutation({
  args: {
    siteId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        status: "error" as const,
        message: "You must be logged in to delete a website.",
      };
    }

    const existing = await ctx.db
      .query("sites")
      .withIndex("by_site_id", (q) => q.eq("id", args.siteId))
      .unique();

    if (!existing || existing.user_id !== identity.subject) {
      return {
        status: "error" as const,
        message: "Website not found or access denied.",
      };
    }

    const screenshots = await ctx.db
      .query("screenshots")
      .withIndex("by_website_id_generated_at", (q) =>
        q.eq("website_id", args.siteId),
      )
      .collect();

    for (const screenshot of screenshots) {
      await ctx.db.delete(screenshot._id);
    }

    const pages = await ctx.db
      .query("pages")
      .withIndex("by_website_id", (q) => q.eq("website_id", args.siteId))
      .collect();

    for (const page of pages) {
      await ctx.db.delete(page._id);
    }

    await ctx.db.delete(existing._id);

    return {
      status: "success" as const,
      message: "Website deleted successfully",
    };
  },
});

export const importSites = mutation({
  args: {
    sites: v.array(siteInput),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const site of args.sites) {
      const existing = await ctx.db
        .query("sites")
        .withIndex("by_site_id", (q) => q.eq("id", site.id))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, site);
        updated += 1;
      } else {
        await ctx.db.insert("sites", site);
        inserted += 1;
      }
    }

    return { inserted, updated };
  },
});
