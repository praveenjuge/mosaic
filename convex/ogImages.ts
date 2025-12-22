import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { extractUrlParts, normalizeUrlBase } from "./utils/url";

const nowTimestamp = () => Date.now();
const toTimestamp = (value: number | string) =>
  typeof value === "number" ? value : Date.parse(value) || 0;

export const checkImageInDatabase = internalQuery({
  args: {
    pageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { sanitizedUrl } = extractUrlParts(args.pageUrl);
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_full_url", (q) => q.eq("full_url", sanitizedUrl))
      .collect();

    if (!pages.length) {
      return null;
    }

    let latestScreenshot: {
      screenshot_url: string;
      generated_at: string | number;
    } | null = null;

    for (const page of pages) {
      const pageLatest = await ctx.db
        .query("screenshots")
        .withIndex("by_page_id_generated_at", (q) =>
          q.eq("page_id", page._id),
        )
        .order("desc")
        .first();

      if (
        pageLatest &&
        (!latestScreenshot ||
          toTimestamp(pageLatest.generated_at) >
            toTimestamp(latestScreenshot.generated_at))
      ) {
        latestScreenshot = pageLatest;
      }
    }

    return latestScreenshot?.screenshot_url ?? null;
  },
});

export const checkWebsiteExistsForUrl = internalQuery({
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

export const storeImageInDatabase = internalMutation({
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

    const website =
      matchingSites[Math.floor(Math.random() * matchingSites.length)];

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
      image_hash: args.imageKey,
      size_in_bytes: args.imageSize,
      generated_at: timestamp,
    });

    return { status: "success" as const };
  },
});
