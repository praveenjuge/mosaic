"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import crypto from "crypto";
import { extractUrlParts, parseWebsiteUrl } from "../src/lib/url";
import { buildPublicImageUrl } from "../src/lib/platform";

type SiteCandidate = {
  siteId: Id<"sites">;
  url_base: string;
  r2Prefix: string;
};

const getR2Key = (
  cacheKey: string,
  prefix?: string,
  isDemo = false,
): string => {
  if (isDemo) {
    return `demo/${cacheKey}.png`;
  }
  if (!prefix) {
    throw new Error("Missing R2 prefix for production images");
  }
  return `${prefix}/${cacheKey}.png`;
};

const generateCacheKey = (url: string): string =>
  crypto.createHash("sha256").update(url).digest("hex");

function validateUrl(url: string, nodeEnv: string): {
  isValid: boolean;
  validatedUrl?: URL;
  error?: string;
} {
  try {
    const validatedUrl = parseWebsiteUrl(url);

    const hostname = validatedUrl.hostname.toLowerCase();
    const isLocalhost = ["localhost", "127.0.0.1", "0.0.0.0"].some(domain =>
      hostname === domain || hostname.includes(domain)
    );

    if (isLocalhost && nodeEnv === "production") {
      return { isValid: false, error: "Local URLs are not allowed" };
    }

    return { isValid: true, validatedUrl };
  } catch {
    return { isValid: false, error: "Invalid URL provided" };
  }
}

async function takeScreenshot(url: string): Promise<ArrayBuffer | null> {
  const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_API_TOKEN: apiToken } = process.env;

  if (!accountId || !apiToken) {
    return null;
  }

  try {
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        viewport: { width: 1200 * 1.3, height: 630 * 1.3 },
        gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
        addStyleTag: [{ content: "* { overflow: hidden; }" }],
      }),
    });

    if (response.ok) {
      return response.arrayBuffer();
    }
    return null;
  } catch {
    return null;
  }
}

export const generateOgImage = action({
  args: {
    url: v.string(),
    isDemo: v.boolean(),
  },
  handler: async (ctx, args) => {
    const nodeEnv = process.env.NODE_ENV ?? "development";

    try {
      const { url, isDemo } = args;

      const { isValid, error } = validateUrl(url, nodeEnv);
      if (!isValid) {
        return { error, status: 400 };
      }

      const cacheKey = generateCacheKey(url);

      let cachedImageUrl: string | null = null;
      let selectedSite: SiteCandidate | null = null;
      let imageKey: string | null = null;

      if (isDemo) {
        imageKey = getR2Key(cacheKey, undefined, true);
        const exists = await ctx.runQuery(api.r2.objectExists, { key: imageKey });

        if (exists) {
          cachedImageUrl = buildPublicImageUrl(imageKey);
          return { imageUrl: cachedImageUrl, cached: true, redirect: false };
        }
      } else {
        const urlBase = extractUrlParts(url).urlBase;

        const sitesResult = await ctx.runQuery(api.ogImages.getSitesForUrlBase, { urlBase });

        if (sitesResult.sites.length === 0) {
          return {
            error: "Website must be added to Mosaic before generating OG images",
            status: 404,
          };
        }

        for (const site of sitesResult.sites) {
          const siteImageKey = getR2Key(cacheKey, site.r2Prefix, false);
          const exists = await ctx.runQuery(api.r2.objectExists, { key: siteImageKey });

          if (exists) {
            cachedImageUrl = buildPublicImageUrl(siteImageKey);
            return { imageUrl: cachedImageUrl, cached: true, redirect: true };
          }
        }

        selectedSite = sitesResult.selectedSite;
        if (!selectedSite) {
          return {
            error: "OG image limit exceeded for this plan. Please upgrade your subscription.",
            status: 403,
          };
        }

        imageKey = getR2Key(cacheKey, selectedSite.r2Prefix, false);
      }

      const imageBuffer = await takeScreenshot(url);
      if (!imageBuffer) {
        return { error: "Failed to take screenshot", status: 500 };
      }

      if (!isDemo && !imageKey) {
        return { error: "Internal server error", status: 500 };
      }

      const finalImageKey = imageKey ?? getR2Key(cacheKey, undefined, true);

      let uploadResult: { url: string; key: string; isNew: boolean } | null = null;

      try {
        await ctx.runAction(api.r2.storeImage, {
          key: finalImageKey,
          contentType: "image/png",
          dataBase64: Buffer.from(imageBuffer).toString("base64"),
        });

        const directUrl = buildPublicImageUrl(finalImageKey);
        uploadResult = { url: directUrl, key: finalImageKey, isNew: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("Metadata already exists for key")) {
          const directUrl = buildPublicImageUrl(finalImageKey);
          uploadResult = { url: directUrl, key: finalImageKey, isNew: false };
        }
      }

      if (!uploadResult) {
        const base64Image = Buffer.from(imageBuffer).toString("base64");
        return {
          imageUrl: `data:image/png;base64,${base64Image}`,
          cached: false,
          fallback: true,
          redirect: false,
        };
      }

      if (isDemo) {
        return { imageUrl: uploadResult.url, cached: false, redirect: false };
      }

      if (selectedSite) {
        const imageSize = Buffer.from(imageBuffer).length;
        await ctx.runMutation(api.ogImages.storeImageForSite, {
          siteId: selectedSite.siteId,
          pageUrl: url,
          imageSize,
          imageKey: uploadResult.key,
          isNew: uploadResult.isNew,
        });
      }

      return { imageUrl: uploadResult.url, cached: false, redirect: true };
    } catch {
      return { error: "Internal server error", status: 500 };
    }
  },
});
