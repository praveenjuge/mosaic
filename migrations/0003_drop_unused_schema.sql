-- 0002 moved generated images into global_images. Nothing reads the old
-- per-site images table, and the dashboard counts images from global_images,
-- so sites.image_count is never read. sites.r2_prefix and sites.refreshed_at
-- belonged to per-site R2 storage and manual refresh, which no longer exist.
DROP TABLE IF EXISTS images;

ALTER TABLE sites DROP COLUMN image_count;
ALTER TABLE sites DROP COLUMN r2_prefix;
ALTER TABLE sites DROP COLUMN refreshed_at;

-- The unique (user_id, url_base) index already serves user_id lookups.
DROP INDEX IF EXISTS idx_sites_user_id;
