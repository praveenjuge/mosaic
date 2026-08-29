-- Security controls for hostname ownership, bounded generation, and race-safe
-- image identity. Existing registrations receive a challenge but remain
-- inactive until their owners prove control of the hostname.

ALTER TABLE sites ADD COLUMN verification_token TEXT;
ALTER TABLE sites ADD COLUMN verified_at TEXT;
ALTER TABLE sites ADD COLUMN generation_secret TEXT;

UPDATE sites
SET verification_token = lower(hex(randomblob(32)));

CREATE UNIQUE INDEX idx_sites_verified_url_base
  ON sites(url_base)
  WHERE verified_at IS NOT NULL;

CREATE UNIQUE INDEX idx_images_site_id_page_url
  ON images(site_id, page_url);

-- One request owns generation for a canonical page at a time. Expired leases
-- can be reclaimed after a Worker failure.
CREATE TABLE generation_locks (
  site_id     INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_url    TEXT    NOT NULL,
  lease_token TEXT    NOT NULL,
  expires_at  INTEGER NOT NULL,
  PRIMARY KEY (site_id, page_url)
);

-- Paid generation is metered independently of revocable image rows so a
-- refresh or delete/re-add cycle cannot reset usage within the billing month.
CREATE TABLE user_usage (
  user_id         TEXT PRIMARY KEY,
  plan            TEXT NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free', 'pro', 'pro-yearly')),
  period_start    INTEGER NOT NULL,
  generated_total INTEGER NOT NULL DEFAULT 0 CHECK (generated_total >= 0)
);

INSERT INTO user_usage (user_id, period_start, generated_total)
SELECT user_id,
       CAST(strftime('%s', 'now', 'start of month') AS INTEGER) * 1000,
       COALESCE(SUM(image_count), 0)
FROM sites
GROUP BY user_id;

-- Durable per-scope windows complement the fast, colo-local Rate Limiting
-- bindings. The primary key makes each conditional increment atomic in D1.
CREATE TABLE generation_budgets (
  scope        TEXT    NOT NULL,
  budget_key   TEXT    NOT NULL,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL CHECK (count >= 0),
  PRIMARY KEY (scope, budget_key)
);
