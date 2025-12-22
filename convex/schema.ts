import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sites: defineTable({
    user_id: v.string(),
    url_base: v.string(),
    created_at: v.union(v.number(), v.string()),
    updated_at: v.union(v.number(), v.string()),
    // Legacy Supabase ID; kept optional until migration runs.
    id: v.optional(v.string()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_url_base", ["url_base"])
    .index("by_user_id_url_base", ["user_id", "url_base"]),
  pages: defineTable({
    website_id: v.id("sites"),
    user_id: v.string(),
    path: v.string(),
    full_url: v.string(),
    created_at: v.union(v.number(), v.string()),
    updated_at: v.union(v.number(), v.string()),
    // Legacy Supabase ID; kept optional until migration runs.
    id: v.optional(v.string()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_website_id", ["website_id"])
    .index("by_website_id_path", ["website_id", "path"])
    .index("by_full_url", ["full_url"]),
  screenshots: defineTable({
    page_id: v.id("pages"),
    website_id: v.id("sites"),
    user_id: v.string(),
    screenshot_url: v.string(),
    page_url: v.optional(v.string()),
    website_name: v.optional(v.string()),
    image_hash: v.optional(v.string()),
    size_in_bytes: v.optional(v.number()),
    generated_at: v.union(v.number(), v.string()),
    // Legacy Supabase ID; kept optional until migration runs.
    id: v.optional(v.string()),
  })
    .index("by_page_id", ["page_id"])
    .index("by_page_id_generated_at", ["page_id", "generated_at"])
    .index("by_website_id_generated_at", ["website_id", "generated_at"])
    .index("by_user_id_generated_at", ["user_id", "generated_at"])
    .index("by_user_id_website_id_generated_at", [
      "user_id",
      "website_id",
      "generated_at",
    ])
    .index("by_page_url_generated_at", ["page_url", "generated_at"]),
});
