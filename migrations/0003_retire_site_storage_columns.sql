-- 0002 moved generated images into global_images. Nothing reads the old
-- per-site images table, and the unique (user_id, url_base) index already
-- serves user_id lookups.
DROP TABLE IF EXISTS images;
DROP INDEX IF EXISTS idx_sites_user_id;

-- Expand step for retiring sites.image_count, r2_prefix, and refreshed_at,
-- which belonged to per-site storage and manual refresh. The current Worker
-- no longer writes r2_prefix, but it was NOT NULL, so rebuild the table with
-- it nullable. The previous Worker, which still writes all three columns,
-- keeps working during deploy and after a rollback. A later migration drops
-- the columns once no deployed version uses them.
CREATE TABLE sites_new (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT    NOT NULL,
  url_base     TEXT    NOT NULL,
  image_count  INTEGER NOT NULL DEFAULT 0,
  r2_prefix    TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  refreshed_at TEXT    DEFAULT NULL
);

INSERT INTO sites_new
  (id, user_id, url_base, image_count, r2_prefix, created_at, refreshed_at)
SELECT id, user_id, url_base, image_count, r2_prefix, created_at, refreshed_at
FROM sites;

-- Keep AUTOINCREMENT from reusing the ids of deleted sites.
UPDATE sqlite_sequence
SET seq = (SELECT seq FROM sqlite_sequence WHERE name = 'sites')
WHERE name = 'sites_new'
  AND EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'sites');

DROP TABLE sites;
ALTER TABLE sites_new RENAME TO sites;

CREATE UNIQUE INDEX idx_sites_user_id_url_base ON sites(user_id, url_base);
CREATE INDEX idx_sites_url_base ON sites(url_base);
