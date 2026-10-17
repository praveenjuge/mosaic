# Mosaic

Mosaic automatically generates Open Graph images for websites by taking screenshots with Cloudflare Browser Run.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/praveenjuge/mosaic)

## Prerequisites

- A Cloudflare account with Workers, D1, R2, and Browser Rendering access
- A Clerk application with a publishable key and secret key

## Deploy

1. Click **Deploy to Cloudflare** and connect your GitHub account.
2. Enter the build-time variables `VITE_SITE_URL` and `VITE_CLERK_PUBLISHABLE_KEY`, plus the runtime secret `CLERK_SECRET_KEY`, when prompted.
3. Deploy the Worker; the deploy command applies the D1 migration before publishing the application.

Cloudflare provisions fork-specific resources from `wrangler.jsonc`. The two `VITE_` values must be available to Workers Builds because Vite embeds them at build time. To use a custom domain, add it in the Worker's **Settings → Domains & Routes**, set `VITE_SITE_URL` to that HTTPS origin in Workers Builds, and allow the origin in Clerk.

## Local development

```sh
bun install --frozen-lockfile
cp .env.example .env.local
bun run db:migrate:local
bun run db:seed:local
bun run dev
```

Fill in all three variables in `.env.local` (use `http://localhost:3000` for `VITE_SITE_URL`). D1 and R2 always use local state in `.wrangler/`.

By default the dev server takes screenshots with a local Chrome driven by Puppeteer, so `/use` works without a Cloudflare account. To use the real Browser Run binding instead, set `CLOUDFLARE_API_TOKEN`, or run `wrangler login` and start dev with `MOSAIC_REMOTE_BINDINGS=1`. If your account's workers.dev subdomain is behind Cloudflare Access, the remote proxy also needs an Access service token in `CLOUDFLARE_ACCESS_CLIENT_ID` and `CLOUDFLARE_ACCESS_CLIENT_SECRET`. `bun run build` never uses remote bindings.

`bun run db:seed:local` registers `example.com`, so `http://localhost:3000/use?url=https://example.com` generates an image right away.

## Tests

```sh
bun run test               # unit tests
bun run build && bun run test:integration  # built Worker in workerd
bun run test:e2e           # Playwright against the dev server
```

CI runs lint, format, type, and binding-type checks plus all three suites on every pull request.

## Previews

`bun run deploy:preview` deploys the current branch as a Worker Preview with its own URL, bound to preview-only D1, R2, rate limiters, and Analytics Engine data (see the `previews` block in `wrangler.jsonc`).

## Claude Code

The repository is set up for [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web): a SessionStart hook (`.claude/settings.json`) installs dependencies, writes placeholder keys, and prepares local D1, so cloud sessions can build, test, and generate screenshots without any credentials. A post-edit hook keeps files formatted and binding types current. Project skills (`run-mosaic`, `new-migration`, `add-binding`) and a `security-reviewer` subagent live in `.claude/`. Project instructions live in `AGENTS.md`, which `CLAUDE.md` imports.

## License

[MIT](LICENSE)
