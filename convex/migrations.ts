import { internalMutation } from "./_generated/server";

const toTimestamp = (value: number | string | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
};

export const backfillScreenshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const siteMap = new Map<string, string>();
    const pageMap = new Map<string, string>();
    let cursor: string | null = null;

    do {
      const page = await ctx.db
        .query("sites")
        .paginate({ cursor, numItems: 100 });
      for (const site of page.page) {
        const createdAt = toTimestamp(
          (site as unknown as { created_at: number | string }).created_at,
        );
        const updatedAt = toTimestamp(
          (site as unknown as { updated_at: number | string }).updated_at,
        );
        if (createdAt !== site.created_at || updatedAt !== site.updated_at) {
          await ctx.db.patch(site._id, {
            created_at: createdAt,
            updated_at: updatedAt,
          });
        }

        siteMap.set(site._id, site.url_base);
      }
      cursor = page.continueCursor;
      if (page.isDone) break;
    } while (cursor);

    cursor = null;
    do {
      const page = await ctx.db
        .query("pages")
        .paginate({ cursor, numItems: 100 });
      for (const pageDoc of page.page) {
        const createdAt = toTimestamp(
          (pageDoc as unknown as { created_at: number | string }).created_at,
        );
        const updatedAt = toTimestamp(
          (pageDoc as unknown as { updated_at: number | string }).updated_at,
        );
        if (createdAt !== pageDoc.created_at || updatedAt !== pageDoc.updated_at) {
          await ctx.db.patch(pageDoc._id, {
            created_at: createdAt,
            updated_at: updatedAt,
          });
        }
        pageMap.set(pageDoc._id, pageDoc.full_url);
      }
      cursor = page.continueCursor;
      if (page.isDone) break;
    } while (cursor);

    cursor = null;
    let screenshotsUpdated = 0;
    do {
      const page = await ctx.db
        .query("screenshots")
        .paginate({ cursor, numItems: 100 });
      for (const screenshot of page.page) {
        const updates: Record<string, string | number> = {};
        const generatedAt = toTimestamp(
          (screenshot as unknown as { generated_at: number | string }).generated_at,
        );
        if (generatedAt !== screenshot.generated_at) {
          updates.generated_at = generatedAt;
        }

        if (!screenshot.page_url) {
          const pageUrl = pageMap.get(screenshot.page_id);
          if (pageUrl) {
            updates.page_url = pageUrl;
          }
        }

        if (!screenshot.website_name) {
          const websiteName = siteMap.get(screenshot.website_id);
          if (websiteName) {
            updates.website_name = websiteName;
          }
        }

        if (Object.keys(updates).length) {
          await ctx.db.patch(screenshot._id, updates);
          screenshotsUpdated += 1;
        }
      }
      cursor = page.continueCursor;
      if (page.isDone) break;
    } while (cursor);

    return {
      screenshotsUpdated,
    };
  },
});

export const clearSiteLegacyFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let updated = 0;

    do {
      const page = await ctx.db
        .query("sites")
        .paginate({ cursor, numItems: 100 });

      for (const site of page.page) {
        await ctx.db.patch(site._id, {
          created_at: undefined,
          updated_at: undefined,
          id: undefined,
        });
        updated += 1;
      }

      cursor = page.continueCursor;
      if (page.isDone) break;
    } while (cursor);

    return { updated };
  },
});
