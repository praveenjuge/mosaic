---
name: run-mosaic
description: Start Mosaic's dev server, generate an OG image, screenshot pages, and inspect local D1, R2, and traces. Use to see a change working in the real app, to show the user what a page looks like, or to debug /use and /i responses — especially in Claude Code cloud sessions, where the user cannot open the dev server.
---

# Run and look at Mosaic

The user can't open a dev server running in a cloud container. After any UI or
generation change, run the app, look at the result yourself, and send the
screenshots to the user (SendUserFile) instead of describing them.

## 1. Start the dev server

```sh
bun run dev > "${TMPDIR:-/tmp}/mosaic-dev.log" 2>&1 &   # run in the background
until curl -s -o /dev/null http://localhost:3000/; do sleep 2; done
```

- Port 3000. `predev` type-checks first, so a type error stops startup; read the log.
- `Failed to start the remote proxy session ... behind Cloudflare Access` means
  remote bindings are on without Access credentials. Restart with
  `MOSAIC_REMOTE_BINDINGS=0` to use local Chrome (cloud sessions set this by
  default; see `scripts/claude-session-start.sh`).
- Stop it when done: `kill $(lsof -t -i:3000)`. Don't `pkill -f "vite dev"`:
  it matches your own shell command and kills it.

## 2. Generate an OG image

```sh
curl -sL -o og.jpeg -w "%{http_code} %{content_type} %{url_effective}\n" \
  "http://localhost:3000/use?url=https://example.com"
```

`/use` answers 307 to `/i/global/<hash>.jpeg`. `example.com` is registered by
`bun run db:seed:local`; other hosts need a row in `sites` first (copy the
insert in `scripts/seed-local.sql`). Open the
JPEG with the Read tool to check it. Repeated runs can hit the daily demo
budget; reset it with
`bunx wrangler d1 execute DB --local --command "DELETE FROM generation_budgets"`.

## 3. Screenshot pages

```sh
node scripts/screenshot-pages.mjs --mobile --out <dir> / /help /legal
node scripts/screenshot-pages.mjs --dark --out <dir> /
```

Prints one `status url -> file` line per page and exits 1 if any page fails.
Read the PNGs, then send the relevant ones to the user. `/dashboard` needs a
signed-in Clerk user, which placeholder keys can't provide; use the Playwright
specs in `e2e/` with a Clerk development instance for that.

## 4. Inspect local state

The Local Explorer API runs on the dev server (no credentials):

```sh
curl -s http://localhost:3000/cdn-cgi/local/explorer/api/r2/buckets
curl -s http://localhost:3000/cdn-cgi/local/explorer/api/d1/database
# SQL over local traces (tables: spans, logs; read attributes with json(attributes))
curl -s -X POST http://localhost:3000/cdn-cgi/local/explorer/api/local/observability/query \
  -H 'Content-Type: application/json' \
  -d '{"sql":"SELECT name, outcome, duration_ms, error FROM spans WHERE parent_id IS NULL ORDER BY start_ms DESC LIMIT 20"}'
```

For D1 rows, `bunx wrangler d1 execute DB --local --command "SELECT ..."` is
simpler. The browser UI is at `/cdn-cgi/local/explorer`.
