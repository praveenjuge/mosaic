import { R2 } from "@convex-dev/r2";
import { v } from "convex/values";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

import { components } from "./_generated/api";
import { action, query } from "./_generated/server";

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

export const objectExists = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const metadata = await r2.getMetadata(ctx, args.key);
    return Boolean(metadata);
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

export const deleteObject = action({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await r2.deleteObject(ctx, args.key);
  },
});

export const deleteObjectsByPrefix = action({
  args: {
    prefix: v.string(),
  },
  handler: async (ctx, args) => {
    const batchSize = 25;
    let continuationToken: string | undefined;
    do {
      const response = await r2.r2.send(
        new ListObjectsV2Command({
          Bucket: r2.config.bucket,
          Prefix: args.prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const keys =
        response.Contents?.map((entry) => entry.Key).filter(
          (key): key is string => Boolean(key),
        ) ?? [];

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await Promise.all(batch.map((key) => r2.deleteObject(ctx, key)));
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);
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
