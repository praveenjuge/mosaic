import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sites: defineTable({
    user_id: v.string(),
    url_base: v.string(),
    image_count: v.optional(v.number()),
    r2_prefix: v.optional(v.string()),
    latest_images: v.optional(
      v.array(
        v.object({
          key: v.string(),
          page_url: v.string(),
          size_in_bytes: v.number(),
          generated_at: v.number(),
        }),
      ),
    ),
  })
    .index("by_user_id", ["user_id"])
    .index("by_url_base", ["url_base"])
    .index("by_user_id_url_base", ["user_id", "url_base"]),
});
