import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";

import { components } from "./_generated/api";
import { action } from "./_generated/server";

const r2 = new R2(components.r2, {
  R2_BUCKET: process.env.R2_BUCKET ?? process.env.PROD_R2_BUCKET_NAME ?? "mosaic-og-prod",
  R2_ENDPOINT:
    process.env.R2_ENDPOINT ??
    (process.env.CLOUDFLARE_ACCOUNT_ID
      ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined),
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? process.env.PROD_R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY:
    process.env.R2_SECRET_ACCESS_KEY ?? process.env.PROD_R2_SECRET_ACCESS_KEY,
});

export const checkObjectExists = action({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      await r2.syncMetadata(ctx, args.key);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isNotFound =
        message.includes("NotFound") ||
        message.includes("NoSuchKey") ||
        message.includes("404");
      if (isNotFound) {
        return false;
      }
      throw error;
    }
  },
});

export const storeImage = action({
  args: {
    key: v.string(),
    contentType: v.optional(v.string()),
    dataBase64: v.string(),
  },
  handler: async (ctx, args) => {
    const bytes = base64ToUint8Array(args.dataBase64);
    const key = await r2.store(ctx, bytes, {
      key: args.key,
      type: args.contentType,
    });
    return key;
  },
});

const base64ToUint8Array = (data: string) => {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};
