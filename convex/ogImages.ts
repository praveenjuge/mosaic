import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { extractUrlParts, normalizeUrlBase } from "./utils/url";
import { PLAN_LIMITS, PLAN_TYPE_MAPPING } from "./constants";
import { api, internal } from "./_generated/api";

const nowTimestamp = () => Date.now();
export const checkImageInDatabase = query({
  args: {
    pageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { sanitizedUrl } = extractUrlParts(args.pageUrl);
    const latestScreenshot = await ctx.db
      .query("screenshots")
      .withIndex("by_full_url", (q) => q.eq("full_url", sanitizedUrl))
      .order("desc")
      .first();

    return latestScreenshot?.screenshot_url ?? null;
  },
});

export const checkWebsiteExistsForUrl = query({
  args: {
    url_base: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedUrl = normalizeUrlBase(args.url_base);
    const existing = await ctx.db
      .query("sites")
      .withIndex("by_url_base", (q) => q.eq("url_base", normalizedUrl))
      .first();

    return Boolean(existing);
  },
});

export const storeImageInDatabase = mutation({
  args: {
    pageUrl: v.string(),
    imageSize: v.number(),
    uploadedUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { urlBase, path, sanitizedUrl } = extractUrlParts(args.pageUrl);

    const matchingSites = await ctx.db
      .query("sites")
      .withIndex("by_url_base", (q) => q.eq("url_base", urlBase))
      .collect();

    if (!matchingSites.length) {
      return {
        status: "skipped" as const,
        message: "No matching websites found for URL base.",
      };
    }

    // Find a website owner who has capacity (fallback to oldest)
    let selectedWebsite = matchingSites.sort(
      (a, b) => a._creationTime - b._creationTime,
    )[0];

    for (const site of matchingSites) {
      const subscription = await ctx.runQuery(internal.billing.getSubscriptionByUserId, {
        userId: site.user_id,
      });
      const planType: keyof typeof PLAN_LIMITS =
        PLAN_TYPE_MAPPING[subscription.plan as keyof typeof PLAN_TYPE_MAPPING] ||
        "FREE";
      const limit = PLAN_LIMITS[planType].IMAGES;

      const screenshots = await ctx.db
        .query("screenshots")
        .withIndex("by_user_id", (q) => q.eq("user_id", site.user_id))
        .collect();

      if (screenshots.length < limit) {
        selectedWebsite = site;
        break;
      }
    }

    const existingPage = await ctx.db
      .query("screenshots")
      .withIndex("by_website_id_path", (q) =>
        q.eq("website_id", selectedWebsite._id).eq("path", path),
      )
      .order("desc")
      .first();

    if (!existingPage) {
      await ctx.db.insert("screenshots", {
        website_id: selectedWebsite._id,
        user_id: selectedWebsite.user_id,
        path,
        full_url: sanitizedUrl,
        screenshot_url: args.uploadedUrl,
        size_in_bytes: args.imageSize,
      });
      return { status: "success" as const };
    }

    await ctx.db.patch(existingPage._id, {
      full_url: sanitizedUrl,
      screenshot_url: args.uploadedUrl,
      size_in_bytes: args.imageSize,
    });
    return { status: "success" as const };
  },
});

export const deleteImage = mutation({
  args: {
    imageId: v.id("screenshots"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to delete images.");
    }

    const screenshot = await ctx.db.get(args.imageId);
    if (!screenshot || screenshot.user_id !== identity.subject) {
      throw new Error("Image not found or access denied.");
    }

    await ctx.db.delete(args.imageId);
  },
});

// Check if any user with this website has capacity (for public API endpoint)
// Returns true if ANY user with this website can accept more images
export const checkWebsiteOwnerLimit = mutation({
  args: {
    urlBase: v.string(),
  },
  handler: async (ctx, args): Promise<{
    canGenerate: boolean;
  }> => {
    // Normalize the url_base to match how it's stored
    const normalizedUrlBase = normalizeUrlBase(args.urlBase);

    // Find all sites with matching url_base
    const matchingSites = await ctx.db
      .query("sites")
      .withIndex("by_url_base", (q) => q.eq("url_base", normalizedUrlBase))
      .collect();

    if (!matchingSites.length) {
      return { canGenerate: false };
    }

    // Check each site owner's limit - return true if ANY has capacity
    for (const site of matchingSites) {
      const subscription = await ctx.runQuery(internal.billing.getSubscriptionByUserId, {
        userId: site.user_id,
      });
      const planType: keyof typeof PLAN_LIMITS =
        PLAN_TYPE_MAPPING[subscription.plan as keyof typeof PLAN_TYPE_MAPPING] ||
        "FREE";
      const limit = PLAN_LIMITS[planType].IMAGES;

      // Count this user's images
      const screenshots = await ctx.db
        .query("screenshots")
        .withIndex("by_user_id", (q) => q.eq("user_id", site.user_id))
        .collect();

      if (screenshots.length < limit) {
        // This user has capacity!
        return { canGenerate: true };
      }
    }

    // All users with this website are at their limit
    return { canGenerate: false };
  },
});
