import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sites: defineTable({
    id: v.string(),
    user_id: v.string(),
    url_base: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_site_id", ["id"])
    .index("by_user_id", ["user_id"])
    .index("by_url_base", ["url_base"])
    .index("by_user_id_url_base", ["user_id", "url_base"]),
  pages: defineTable({
    id: v.string(),
    website_id: v.string(),
    user_id: v.string(),
    path: v.string(),
    full_url: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("by_page_id", ["id"])
    .index("by_user_id", ["user_id"])
    .index("by_website_id", ["website_id"])
    .index("by_website_id_path", ["website_id", "path"])
    .index("by_full_url", ["full_url"]),
  screenshots: defineTable({
    id: v.string(),
    page_id: v.string(),
    website_id: v.string(),
    user_id: v.string(),
    screenshot_url: v.string(),
    image_hash: v.optional(v.string()),
    size_in_bytes: v.optional(v.number()),
    generated_at: v.string(),
  })
    .index("by_screenshot_id", ["id"])
    .index("by_page_id", ["page_id"])
    .index("by_page_id_generated_at", ["page_id", "generated_at"])
    .index("by_website_id_generated_at", ["website_id", "generated_at"])
    .index("by_user_id_generated_at", ["user_id", "generated_at"])
    .index("by_user_id_website_id_generated_at", [
      "user_id",
      "website_id",
      "generated_at",
    ]),
});
