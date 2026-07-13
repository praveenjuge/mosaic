# Mosaic

Mosaic automatically generates Open Graph images for websites by taking screenshots with Cloudflare Browser Rendering.

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
bun run dev
```

Fill in all three variables in `.env.local` (use `http://localhost:3000` for `VITE_SITE_URL`) and run `wrangler login` first. Browser Run uses the remote `BROWSER` binding during local development, so screenshot generation requires an authenticated Cloudflare account with Browser Rendering access.

## License

[MIT](LICENSE)
