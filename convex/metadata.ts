import { action } from "./_generated/server";
import { v } from "convex/values";

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

export const fetchMetadata = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(args.url);
    } catch {
      throw new Error("Please enter a valid URL.");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are supported.");
    }

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
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
      let userMessage = "Failed to fetch metadata";
      if (response.status === 403) {
        userMessage =
          "This website blocks automated requests. Please try a different URL.";
      } else if (response.status === 404) {
        userMessage =
          "The requested page was not found. Please check the URL and try again.";
      } else if (response.status === 502) {
        userMessage =
          "The website is currently experiencing issues. Please try again later.";
      }
      throw new Error(userMessage);
    }

    const html = await response.text();

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
        image = new URL(image, parsedUrl).toString();
      } catch {
        // Keep original if it can't be normalized.
      }
    }

    return {
      title,
      description,
      image,
    };
  },
});
