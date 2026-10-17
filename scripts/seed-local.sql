-- Local-only seed data so /use works in dev without signing in.
-- Apply with `bun run db:seed:local` after `bun run db:migrate:local`.
INSERT OR IGNORE INTO sites (user_id, url_base, r2_prefix)
VALUES ('user_local_dev', 'example.com', 'user_local_dev/example.com');
