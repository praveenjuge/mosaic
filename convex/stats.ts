import { query } from "./_generated/server";

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        total_images: 0,
        total_storage_bytes: 0,
        total_websites: 0,
      };
    }

    const screenshots = await ctx.db
      .query("screenshots")
      .withIndex("by_user_id_generated_at", (q) =>
        q.eq("user_id", identity.subject),
      )
      .collect();

    const totalImages = screenshots.length;
    const totalStorageBytes = screenshots.reduce(
      (sum, shot) => sum + (shot.size_in_bytes ?? 0),
      0,
    );
    const websites = await ctx.db
      .query("sites")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .collect();

    return {
      total_images: totalImages,
      total_storage_bytes: totalStorageBytes,
      total_websites: websites.length,
    };
  },
});
