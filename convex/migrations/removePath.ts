import { mutation } from "../_generated/server";

// Migration: Remove 'path' field from all screenshots
// Run with: npx convex run migrations/removePath
export default mutation({
  args: {},
  handler: async (ctx) => {
    const screenshots = await ctx.db.query("screenshots").collect();

    let updated = 0;
    for (const screenshot of screenshots) {
      if (screenshot.path !== undefined) {
        await ctx.db.patch(screenshot._id, {
          path: undefined,
        });
        updated++;
      }
    }

    return { updated, total: screenshots.length };
  },
});
