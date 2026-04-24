CREATE TABLE IF NOT EXISTS sites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  url_base    TEXT    NOT NULL,
  image_count INTEGER NOT NULL DEFAULT 0,
  r2_prefix   TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sites_user_id
  ON sites(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_user_id_url_base
  ON sites(user_id, url_base);

CREATE INDEX IF NOT EXISTS idx_sites_url_base
  ON sites(url_base);

CREATE TABLE IF NOT EXISTS images (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id       INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  key           TEXT    NOT NULL,
  page_url      TEXT    NOT NULL,
  size_in_bytes INTEGER NOT NULL,
  generated_at  INTEGER NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_images_site_id
  ON images(site_id);

CREATE INDEX IF NOT EXISTS idx_images_page_url_site_id
  ON images(page_url, site_id);
