---
name: add-binding
description: Add or change a Cloudflare binding (D1, R2, KV, Queues, Workflows, Images, AI, rate limiter, Analytics Engine, secrets) in Mosaic's wrangler.jsonc so production, Worker Previews, local dev, types, and tests all stay in sync. Use before touching wrangler.jsonc.
---

# Add a Cloudflare binding

Load the `wrangler` and `workers-best-practices` skills for product details.
Then work through every place a binding has to appear:

1. **`wrangler.jsonc` top level** — the production binding.
2. **`wrangler.jsonc` `previews` block** — Previews don't inherit production
   bindings. Storage (D1, R2, KV, Analytics Engine datasets, rate limiter
   `namespace_id`s) must point at preview-only resources so previews never
   touch production data; API bindings (`browser`, `ai`, `images`) are listed
   as-is. Queue consumers, Cron Triggers, and routes don't run on Previews.
   A new preview D1 database also goes in `wrangler.preview-db.jsonc`.
3. **`package.json` `cloudflare.bindings`** — a one-line description; the
   Deploy to Cloudflare button shows it.
4. **Types** — `bun run cf-typegen` regenerates `worker-configuration.d.ts`
   (the PostToolUse hook does this when you edit `wrangler.jsonc`), and
   `bun run cf-typegen:check` must pass. Secrets go in `secrets.required`.
5. **Local dev** — confirm the binding works under `bun run dev` without
   credentials. If it is remote-only (like `BROWSER`), add a dev fallback
   behind `import.meta.env.DEV` (see `src/lib/local-screenshot.ts`) and
   decide how `tests/integration/worker.test.ts` handles it offline.
6. **Code** — read bindings with `import { env } from "cloudflare:workers"`.
7. **Docs** — mention the binding in `AGENTS.md` (Core Technologies) and, if
   it needs a manual step, in `README.md`.
8. **PR description** — list what a human must create or run, for example
   `wrangler r2 bucket create mosaic-<name>-preview`, a new D1 database id,
   or `wrangler preview base-config secret put <NAME>`. Agents can't create
   remote resources, deploy, or set secrets.

Then run `bun run lint:check`, `bun run typecheck`, `bun run test`, and
`bun run build && bun run test:integration`.
