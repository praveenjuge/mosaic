import { getDb } from "@/lib/db";
import type { ImageRecord, Site } from "@/lib/types";
import { DEFAULT_SITE_URL, extractHostname, LEGACY_SITE_URL } from "@/lib/url";
import { createServerFn } from "@tanstack/react-start";
import { env, waitUntil } from "cloudflare:workers";
import { z } from "zod";
import { authMiddleware } from "./middleware";

// ── Helpers ─────────────────────────────────────────────────────────

function generateR2Prefix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── List Sites ──────────────────────────────────────────────────────

export const listSitesForUser = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Site[]> => {
    // Read-only query — use a read session to hit the nearest replica
    const session = getDb().withSession();
    const result = await session
      .prepare("SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC")
      .bind(context.userId)
      .all<Site>();

    return result.results;
  });

// ── Add Site ────────────────────────────────────────────────────────

const addSiteSchema = z.object({
  url_base: z.string(),
});

export const addSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(addSiteSchema)
  .handler(async ({ context, data }): Promise<Site> => {
    const normalizedUrl = extractHostname(data.url_base);
    const db = getDb();

    const existing = await db
      .prepare("SELECT id FROM sites WHERE user_id = ? AND url_base = ?")
      .bind(context.userId, normalizedUrl)
      .first<{ id: number }>();

    if (existing) {
      throw new Error("This website already exists in your list.");
    }

    const r2Prefix = generateR2Prefix();

    const insertResult = await db
      .prepare(
        "INSERT INTO sites (user_id, url_base, image_count, r2_prefix) VALUES (?, ?, 0, ?)",
      )
      .bind(context.userId, normalizedUrl, r2Prefix)
      .run();

    const newSite = await db
      .prepare("SELECT * FROM sites WHERE id = ?")
      .bind(insertResult.meta.last_row_id)
      .first<Site>();

    if (!newSite) {
      throw new Error("Failed to create website. Please try again.");
    }

    return newSite;
  });

// ── Edit Site ───────────────────────────────────────────────────────

const editSiteSchema = z.object({
  siteId: z.number(),
  url_base: z.string(),
});

export const editSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(editSiteSchema)
  .handler(async ({ context, data }): Promise<Site> => {
    const db = getDb();

    const existing = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first<Site>();

    if (!existing) {
      throw new Error("Website not found or access denied.");
    }

    const normalizedUrl = extractHostname(data.url_base);

    const duplicate = await db
      .prepare(
        "SELECT id FROM sites WHERE user_id = ? AND url_base = ? AND id != ?",
      )
      .bind(context.userId, normalizedUrl, data.siteId)
      .first<{ id: number }>();

    if (duplicate) {
      throw new Error("This website already exists in your list.");
    }

    await db
      .prepare("UPDATE sites SET url_base = ? WHERE id = ?")
      .bind(normalizedUrl, data.siteId)
      .run();

    return { ...existing, url_base: normalizedUrl };
  });

// ── Delete Site ─────────────────────────────────────────────────────

const deleteSiteSchema = z.object({
  siteId: z.number(),
});

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(deleteSiteSchema)
  .handler(async ({ context, data }): Promise<void> => {
    const db = getDb();

    const existing = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first<Site>();

    if (!existing) {
      throw new Error("Website not found.");
    }

    // Delete site row first for immediate user feedback — cascades to images via FK
    await db.prepare("DELETE FROM sites WHERE id = ?").bind(data.siteId).run();

    // Clean up R2 objects in the background — don't block the response
    const r2Prefix = existing.r2_prefix;
    waitUntil(
      (async () => {
        let cursor: string | undefined;
        do {
          const listed = await env.OG_BUCKET.list({
            prefix: `${r2Prefix}/`,
            cursor,
          });
          if (listed.objects.length > 0) {
            await Promise.all(
              listed.objects.map((obj) => env.OG_BUCKET.delete(obj.key)),
            );
          }
          cursor = listed.truncated ? listed.cursor : undefined;
        } while (cursor);
      })().catch((err) =>
        console.error("[DELETE] R2 cleanup failed for prefix:", r2Prefix, err),
      ),
    );
  });

// ── Refresh Site Images ─────────────────────────────────────────────

const refreshSiteSchema = z.object({
  siteId: z.number(),
});

export const refreshSiteImages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(refreshSiteSchema)
  .handler(async ({ context, data }): Promise<void> => {
    const db = getDb();

    const existing = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, context.userId)
      .first<Site>();

    if (!existing) {
      throw new Error("Website not found or access denied.");
    }

    // 1. Collect page URLs before deleting (needed for edge cache purge)
    const imageRows = await db
      .prepare("SELECT page_url FROM images WHERE site_id = ?")
      .bind(data.siteId)
      .all<Pick<ImageRecord, "page_url">>();

    // 2. Purge edge cache for each page URL
    const cache = (caches as unknown as { default: Cache })["default"];
    const purgePromises = imageRows.results.flatMap((row) => {
      const encoded = encodeURIComponent(row.page_url);
      // Purge both the canonical host and the legacy host so OG images
      // embedded on customer sites via either domain get regenerated.
      return [DEFAULT_SITE_URL, LEGACY_SITE_URL].map((base) => {
        const cacheRequest = new Request(`${base}use?url=${encoded}`, {
          method: "GET",
        });
        return cache.delete(cacheRequest).catch((err) => {
          console.error("[REFRESH] Cache purge failed for:", row.page_url, err);
        });
      });
    });
    await Promise.all(purgePromises);

    // 3. Delete all R2 objects under the current r2_prefix
    const oldPrefix = existing.r2_prefix;
    let cursor: string | undefined;
    do {
      const listed = await env.OG_BUCKET.list({
        prefix: `${oldPrefix}/`,
        cursor,
      });
      if (listed.objects.length > 0) {
        // R2 delete accepts up to 1000 keys at once
        const keys = listed.objects.map((obj) => obj.key);
        await env.OG_BUCKET.delete(keys);
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    // 4. Generate a new r2_prefix for fresh namespace
    const newR2Prefix = generateR2Prefix();

    // 5. Batch D1: delete image rows + update site with new prefix and reset count
    await db.batch([
      db.prepare("DELETE FROM images WHERE site_id = ?").bind(data.siteId),
      db
        .prepare(
          "UPDATE sites SET r2_prefix = ?, image_count = 0, refreshed_at = datetime('now') WHERE id = ?",
        )
        .bind(newR2Prefix, data.siteId),
    ]);
  });
