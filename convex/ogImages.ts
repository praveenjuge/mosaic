import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const nowIso = () => new Date().toISOString();

const sanitizeUrl = (url: string) => url.trim().replace(/\\+$/, "");

const cleanUrl = (url: string): string => {
  if (!url) return "";
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    return parsed.hostname;
  } catch {
    try {
      const urlWithProtocol =
        trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : `https://${trimmed}`;
      const parsed = new URL(urlWithProtocol);
      return parsed.hostname;
    } catch {
      const domainMatch = trimmed.match(
        /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/,
      );
      return domainMatch ? domainMatch[1] : trimmed;
    }
  }
};

const extractUrlParts = (fullUrl: string) => {
  const sanitized = sanitizeUrl(fullUrl);
  try {
    const parsed = new URL(sanitized);
    return {
      urlBase: parsed.hostname,
      path: parsed.pathname + parsed.search + parsed.hash,
    };
  } catch {
    const cleaned = cleanUrl(fullUrl);
    return {
      urlBase: cleaned,
      path: "/",
    };
  }
};

const createPageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `page_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const createScreenshotId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `shot_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const checkImageInDatabase = query({
  args: {
    pageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const sanitizedUrl = sanitizeUrl(args.pageUrl);
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_full_url", (q) => q.eq("full_url", sanitizedUrl))
      .collect();

    if (!pages.length) {
      return null;
    }

    let latestScreenshot: {
      screenshot_url: string;
      generated_at: string;
    } | null = null;

    for (const page of pages) {
      const pageLatest = await ctx.db
        .query("screenshots")
        .withIndex("by_page_id_generated_at", (q) => q.eq("page_id", page.id))
        .order("desc")
        .first();

      if (
        pageLatest &&
        (!latestScreenshot ||
          pageLatest.generated_at > latestScreenshot.generated_at)
      ) {
        latestScreenshot = pageLatest;
      }
    }

    return latestScreenshot?.screenshot_url ?? null;
  },
});

export const checkWebsiteExistsForUrl = query({
  args: {
    url_base: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sites")
      .withIndex("by_url_base", (q) => q.eq("url_base", args.url_base))
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
    const sanitizedUrl = sanitizeUrl(args.pageUrl);
    const { urlBase, path } = extractUrlParts(sanitizedUrl);

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
        q.eq("website_id", website.id).eq("path", path),
      )
      .unique();

    const timestamp = nowIso();
    const pageId = existingPage?.id ?? createPageId();

    if (!existingPage) {
      const page = {
        id: pageId,
        website_id: website.id,
        user_id: website.user_id,
        path,
        full_url: sanitizedUrl,
        created_at: timestamp,
        updated_at: timestamp,
      };

      await ctx.db.insert("pages", page);
    } else if (existingPage.full_url !== sanitizedUrl) {
      await ctx.db.patch(existingPage._id, {
        full_url: sanitizedUrl,
        updated_at: timestamp,
      });
    }

    await ctx.db.insert("screenshots", {
      id: createScreenshotId(),
      page_id: pageId,
      website_id: website.id,
      user_id: website.user_id,
      screenshot_url: args.uploadedUrl,
      image_hash: args.imageKey,
      size_in_bytes: args.imageSize,
      generated_at: timestamp,
    });

    return { status: "success" as const };
  },
});
