import { internalMutation } from "./_generated/server";

export const migrateLegacyIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const siteMap = new Map<string, string>();
    const pageMap = new Map<string, string>();
    let cursor: string | null = null;

    // Build legacy site ID -> Convex _id map.
    do {
      const page = await ctx.db
        .query("sites")
        .paginate({ cursor, numItems: 100 });
      for (const site of page.page) {
        if (site.id) {
          siteMap.set(site.id, site._id);
        }
      }
      cursor = page.continueCursor;
      if (page.isDone) break;
    } while (cursor);

    cursor = null;
    let pagesUpdated = 0;

    // Build legacy page ID -> Convex _id map and fix page.website_id.
    do {
      const page = await ctx.db
        .query("pages")
        .paginate({ cursor, numItems: 100 });
      for (const pageDoc of page.page) {
        if (pageDoc.id) {
          pageMap.set(pageDoc.id, pageDoc._id);
        }
        if (typeof pageDoc.website_id === "string") {
          const newWebsiteId = siteMap.get(pageDoc.website_id);
          if (newWebsiteId) {
            await ctx.db.patch(pageDoc._id, {
              website_id: newWebsiteId,
            });
            pagesUpdated += 1;
          }
        }
      }
      cursor = page.continueCursor;
      if (page.isDone) break;
    } while (cursor);

    cursor = null;
    let screenshotsUpdated = 0;

    // Fix screenshot.website_id and screenshot.page_id.
    do {
      const page = await ctx.db
        .query("screenshots")
        .paginate({ cursor, numItems: 100 });
      for (const screenshot of page.page) {
        const updates: Record<string, string> = {};
        if (typeof screenshot.website_id === "string") {
          const newWebsiteId = siteMap.get(screenshot.website_id);
          if (newWebsiteId) {
            updates.website_id = newWebsiteId;
          }
        }
        if (typeof screenshot.page_id === "string") {
          const newPageId = pageMap.get(screenshot.page_id);
          if (newPageId) {
            updates.page_id = newPageId;
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
      sitesWithLegacyId: siteMap.size,
      pagesUpdated,
      screenshotsUpdated,
    };
  },
});
