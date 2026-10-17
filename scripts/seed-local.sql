-- Local-only seed data so /use works in dev without signing in.
-- Apply with `bun run db:seed:local` after `bun run db:migrate:local`.
INSERT INTO sites (user_id, url_base, r2_prefix)
SELECT 'user_local_dev', 'example.com', 'user_local_dev/example.com'
WHERE NOT EXISTS (
  SELECT 1 FROM sites
  WHERE user_id = 'user_local_dev' AND url_base = 'example.com'
);
