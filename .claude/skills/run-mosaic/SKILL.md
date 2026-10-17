---
name: run-mosaic
description: Start Mosaic's dev server, generate an OG image, screenshot pages, and inspect local D1, R2, and traces. Use to see a change working in the real app, to show the user what a page looks like, or to debug /use and /i responses — especially in Claude Code cloud sessions, where the user cannot open the dev server.
---

# Run and look at Mosaic

The user can't open a dev server running in a cloud container. After any UI or
generation change, run the app, look at the result yourself, and send the
screenshots to the user (SendUserFile) instead of describing them.

## 1. Start the dev server

Run this as one command. It stops waiting after about three minutes, or as soon as the dev
process exits, and then prints the end of the log:

```sh
log="${TMPDIR:-/tmp}/mosaic-dev.log"
bun run dev > "$log" 2>&1 &
dev_pid=$!
for _ in $(seq 1 90); do
  curl -s -o /dev/null http://localhost:3000/ && echo ready && break
  if ! kill -0 "$dev_pid" 2>/dev/null; then echo "dev exited"; tail -40 "$log"; break; fi
  sleep 2
done
```

- Port 3000.
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

`/use` answers 307 to `/i/global/<hash>-<version>.jpeg`; each new screenshot gets a new version, and an expired image is served at once while the new one is taken in the background. `example.com` is registered by
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

Prints one `status url -> file` line per page and exits 1 if any page fails to
load or answers 400 or above (the screenshot is still saved). `--dark` selects
the app's dark theme. Read the PNGs, then send the relevant ones to the user.
The dashboard is the signed-in view of `/`. Placeholder keys can't sign in, but
when the environment sets real Clerk development keys and
`E2E_CLERK_USER_EMAIL` (check with `[ -n "$E2E_CLERK_USER_EMAIL" ]`), a
throwaway Playwright spec can sign in and screenshot it. Put the spec in
`e2e/` so it picks up the config, wait for hydration before clicking (see
`e2e/dashboard.spec.ts`), clean up any sites it adds, and delete the spec
afterwards:

```ts
import { clerk } from "@clerk/testing/playwright";
import { test } from "@playwright/test";

test("shot", async ({ page }) => {
  await page.goto("/help");
  await clerk.signIn({ page, emailAddress: process.env.E2E_CLERK_USER_EMAIL! });
  await page.goto("/");
  await page.screenshot({ path: "<dir>/dashboard.png", fullPage: true });
});
```

Run it with `bunx playwright test e2e/<name>.spec.ts`. Stop your own dev server
first: Playwright starts one on port 3000.

Screenshots here are for looking. Pixel baselines live in
`e2e/visual.spec.ts`; see "Testing" in `AGENTS.md`.

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
