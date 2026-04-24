import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { getDb } from "@/lib/db";
import type { Site } from "@/lib/types";
import { normalizeUrlBase } from "@/lib/url";

// ── Helpers ─────────────────────────────────────────────────────────

function generateR2Prefix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── List Sites ──────────────────────────────────────────────────────

export const listSitesForUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<Site[]> => {
    const { userId } = await auth();
    if (!userId) {
      return [];
    }

    const db = getDb();
    const result = await db
      .prepare("SELECT * FROM sites WHERE user_id = ? ORDER BY created_at DESC")
      .bind(userId)
      .all<Site>();

    return result.results;
  },
);

// ── Add Site ────────────────────────────────────────────────────────

const addSiteSchema = z.object({
  url_base: z.string(),
});

export const addSite = createServerFn({ method: "POST" })
  .inputValidator(addSiteSchema)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return {
        status: "error" as const,
        message: "You must be logged in to add a website.",
      };
    }

    const normalizedUrl = normalizeUrlBase(data.url_base);
    const db = getDb();

    const existing = await db
      .prepare("SELECT id FROM sites WHERE user_id = ? AND url_base = ?")
      .bind(userId, normalizedUrl)
      .first<{ id: number }>();

    if (existing) {
      return {
        status: "error" as const,
        message: "This website already exists in your list.",
      };
    }

    const r2Prefix = generateR2Prefix();

    const insertResult = await db
      .prepare(
        "INSERT INTO sites (user_id, url_base, image_count, r2_prefix) VALUES (?, ?, 0, ?)",
      )
      .bind(userId, normalizedUrl, r2Prefix)
      .run();

    const newSite = await db
      .prepare("SELECT * FROM sites WHERE id = ?")
      .bind(insertResult.meta.last_row_id)
      .first<Site>();

    return {
      status: "success" as const,
      message: "Website added successfully",
      data: newSite ? [newSite] : [],
    };
  });

// ── Edit Site ───────────────────────────────────────────────────────

const editSiteSchema = z.object({
  siteId: z.number(),
  url_base: z.string(),
});

export const editSite = createServerFn({ method: "POST" })
  .inputValidator(editSiteSchema)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return {
        status: "error" as const,
        message: "You must be logged in to edit a website.",
      };
    }

    const db = getDb();

    const existing = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, userId)
      .first<Site>();

    if (!existing) {
      return {
        status: "error" as const,
        message: "Website not found or access denied.",
      };
    }

    const normalizedUrl = normalizeUrlBase(data.url_base);

    const duplicate = await db
      .prepare(
        "SELECT id FROM sites WHERE user_id = ? AND url_base = ? AND id != ?",
      )
      .bind(userId, normalizedUrl, data.siteId)
      .first<{ id: number }>();

    if (duplicate) {
      return {
        status: "error" as const,
        message: "This website already exists in your list.",
      };
    }

    await db
      .prepare("UPDATE sites SET url_base = ? WHERE id = ?")
      .bind(normalizedUrl, data.siteId)
      .run();

    return {
      status: "success" as const,
      message: "Website updated successfully",
      data: [{ ...existing, url_base: normalizedUrl }],
    };
  });

// ── Delete Site ─────────────────────────────────────────────────────

const deleteSiteSchema = z.object({
  siteId: z.number(),
});

export const deleteSite = createServerFn({ method: "POST" })
  .inputValidator(deleteSiteSchema)
  .handler(async ({ data }) => {
    const { userId } = await auth();
    if (!userId) {
      return {
        status: "error" as const,
        message: "You must be logged in to delete a website.",
      };
    }

    const db = getDb();

    const existing = await db
      .prepare("SELECT * FROM sites WHERE id = ? AND user_id = ?")
      .bind(data.siteId, userId)
      .first<Site>();

    if (!existing) {
      return {
        status: "error" as const,
        message: "Website not found.",
      };
    }

    // Delete all R2 objects under the site's r2_prefix using cursor-based pagination
    const r2Prefix = existing.r2_prefix;
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

    // Delete site row — cascades to images via FK ON DELETE CASCADE
    await db.prepare("DELETE FROM sites WHERE id = ?").bind(data.siteId).run();

    return {
      status: "success" as const,
      message: "Website deleted successfully",
    };
  });
