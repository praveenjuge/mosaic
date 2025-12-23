import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { extractUrlParts, normalizeUrlBase } from "./utils/url";

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

    const website = matchingSites.sort(
      (a, b) => a._creationTime - b._creationTime,
    )[0];

    const existingPage = await ctx.db
      .query("screenshots")
      .withIndex("by_website_id_path", (q) =>
        q.eq("website_id", website._id).eq("path", path),
      )
      .order("desc")
      .first();

    const timestamp = nowTimestamp();

    if (!existingPage) {
      await ctx.db.insert("screenshots", {
        website_id: website._id,
        user_id: website.user_id,
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
