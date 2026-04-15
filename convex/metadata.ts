import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  ensureWebsiteProtocol,
  extractUrlParts,
  parseWebsiteUrl,
} from "../src/lib/url";

const normalizeText = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const extractMeta = (
  html: string,
  attr: "property" | "name",
  names: string[],
) => {
  for (const name of names) {
    const regex = new RegExp(
      `<meta[^>]*${attr}=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "i",
    );
    const match = html.match(regex);
    if (match?.[1]) {
      return normalizeText(match[1]);
    }
  }
  return null;
};

const extractTitleTag = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] ? normalizeText(match[1]) : null;
};

const getUserMessageForStatus = (status: number): string => {
  if (status === 403) {
    return "This website blocks automated requests. Please try a different URL.";
  }
  if (status === 404) {
    return "The requested page was not found. Please check the URL and try again.";
  }
  if (status === 502) {
    return "The website is currently experiencing issues. Please try again later.";
  }
  return "Failed to fetch metadata";
};

const fetchPageHtml = async (url: URL): Promise<string> => {
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MosaicBot/1.0; +https://mosaicimg.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    throw new Error(
      "Failed to fetch metadata. Please check the URL and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(getUserMessageForStatus(response.status));
  }

  return response.text();
};

const extractMetadata = (html: string, baseUrl: URL) => {
  const title =
    extractMeta(html, "property", ["og:title"]) ||
    extractMeta(html, "name", ["twitter:title", "title"]) ||
    extractTitleTag(html) ||
    "";

  const description =
    extractMeta(html, "property", ["og:description"]) ||
    extractMeta(html, "name", ["description", "twitter:description"]) ||
    "";

  let image =
    extractMeta(html, "property", ["og:image"]) ||
    extractMeta(html, "name", ["twitter:image", "twitter:image:src"]) ||
    "";

  if (image) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      // Keep original if it can't be normalized.
    }
  }

  return { title, description, image };
};

export const fetchMetadata = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    const parsedUrl = parseWebsiteUrl(args.url);
    const html = await fetchPageHtml(parsedUrl);
    return extractMetadata(html, parsedUrl);
  },
});

export const fetchDemoData = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args): Promise<{
    normalizedUrl: string;
    title: string;
    description: string;
    image: string;
    imageUrl: string | null;
    error?: string;
  }> => {
    const normalizedUrl = ensureWebsiteProtocol(args.url);
    const parsedUrl = parseWebsiteUrl(normalizedUrl);
    const html = await fetchPageHtml(parsedUrl);
    const metadata = extractMetadata(html, parsedUrl);
    const { sanitizedUrl } = extractUrlParts(normalizedUrl);

    const ogImageResult = await ctx.runAction(api.ogImageGeneration.generateOgImage, {
      url: normalizedUrl,
      isDemo: true,
    });

    if ("error" in ogImageResult) {
      return {
        normalizedUrl: sanitizedUrl,
        ...metadata,
        imageUrl: null,
        error: ogImageResult.error,
      };
    }

    return {
      normalizedUrl: sanitizedUrl,
      ...metadata,
      imageUrl: ogImageResult.imageUrl,
    };
  },
});
