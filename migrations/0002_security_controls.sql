-- Shared OG cache. Website registrations remain user-owned bookmarks, while
-- generated images belong to the service-wide canonical URL cache.
CREATE TABLE global_images (
  page_url      TEXT PRIMARY KEY,
  hostname      TEXT    NOT NULL,
  key           TEXT    NOT NULL UNIQUE,
  size_in_bytes INTEGER NOT NULL,
  generated_at  INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL
);

CREATE INDEX idx_global_images_hostname
  ON global_images(hostname);

-- Preserve existing cached images without assigning their page history to a
-- new user. If duplicates exist globally, keep the earliest generated record.
INSERT INTO global_images
  (page_url, hostname, key, size_in_bytes, generated_at, expires_at)
SELECT i.page_url, s.url_base, i.key, i.size_in_bytes, i.generated_at,
       i.generated_at + 2592000000
FROM images i
JOIN sites s ON s.id = i.site_id
WHERE i.id = (
  SELECT MIN(existing.id)
  FROM images existing
  WHERE existing.page_url = i.page_url
);

-- One request owns generation for a canonical page at a time. The lease token
-- prevents an expired worker from releasing a newer worker's lock.
CREATE TABLE generation_locks (
  page_url    TEXT PRIMARY KEY,
  lease_token TEXT    NOT NULL,
  expires_at  INTEGER NOT NULL
);

-- Durable per-scope windows complement the fast, colo-local Rate Limiting
-- bindings. The primary key makes each conditional increment atomic in D1.
CREATE TABLE generation_budgets (
  scope        TEXT    NOT NULL,
  budget_key   TEXT    NOT NULL,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL CHECK (count >= 0),
  PRIMARY KEY (scope, budget_key)
);
