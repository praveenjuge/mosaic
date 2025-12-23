import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { extractUrlParts, normalizeUrlBase } from "./utils/url";

const nowTimestamp = () => Date.now();
const toTimestamp = (value: number | string) =>
  typeof value === "number" ? value : Date.parse(value) || 0;

export const checkImageInDatabase = query({
  args: {
    pageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { sanitizedUrl } = extractUrlParts(args.pageUrl);
    const latestScreenshot = await ctx.db
      .query("screenshots")
      .withIndex("by_page_url_generated_at", (q) =>
        q.eq("page_url", sanitizedUrl),
      )
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
    imageKey: v.string(),
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
      (a, b) => toTimestamp(a.created_at) - toTimestamp(b.created_at),
    )[0];

    const existingPage = await ctx.db
      .query("pages")
      .withIndex("by_website_id_path", (q) =>
        q.eq("website_id", website._id).eq("path", path),
      )
      .unique();

    const timestamp = nowTimestamp();
    const pageId = existingPage?._id;

    if (!existingPage) {
      const page = {
        website_id: website._id,
        user_id: website.user_id,
        path,
        full_url: sanitizedUrl,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const newPageId = await ctx.db.insert("pages", page);
      await ctx.db.insert("screenshots", {
        page_id: newPageId,
        website_id: website._id,
        user_id: website.user_id,
        screenshot_url: args.uploadedUrl,
        page_url: sanitizedUrl,
        website_name: website.url_base,
        image_hash: args.imageKey,
        size_in_bytes: args.imageSize,
        generated_at: timestamp,
      });
      return { status: "success" as const };
    } else if (existingPage.full_url !== sanitizedUrl) {
      await ctx.db.patch(existingPage._id, {
        full_url: sanitizedUrl,
        updated_at: timestamp,
      });
    }

    await ctx.db.insert("screenshots", {
      page_id: pageId!,
      website_id: website._id,
      user_id: website.user_id,
      screenshot_url: args.uploadedUrl,
      page_url: sanitizedUrl,
      website_name: website.url_base,
      image_hash: args.imageKey,
      size_in_bytes: args.imageSize,
      generated_at: timestamp,
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
