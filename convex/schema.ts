import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sites: defineTable({
    user_id: v.string(),
    url_base: v.string(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_url_base", ["url_base"])
    .index("by_user_id_url_base", ["user_id", "url_base"]),
  screenshots: defineTable({
    website_id: v.id("sites"),
    user_id: v.string(),
    path: v.optional(v.string()),
    full_url: v.string(),
    screenshot_url: v.string(),
    size_in_bytes: v.optional(v.number()),
  })
    .index("by_website_id", ["website_id"])
    .index("by_user_id", ["user_id"])
    .index("by_user_id_website_id", ["user_id", "website_id"])
    .index("by_website_id_path", ["website_id", "path"])
    .index("by_full_url", ["full_url"]),
});
