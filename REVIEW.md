# Review guidelines

Mosaic is a public screenshot service on Cloudflare Workers. Prioritize these
when reviewing a pull request:

## Security

- Every outbound URL passes `validateOutboundUrl()` in `src/lib/url.ts`, and
  pages are fetched through `fetchPublicPage()` in `src/lib/metadata.ts` so
  each redirect is validated, before anything fetches or screenshots them.
  Flag any new fetch or Browser Run call that skips them (SSRF).
- Server functions that read or change user data call Clerk `auth()` and scope
  every D1 query to `userId`.
- D1 queries use `.bind()` parameters, never string interpolation.
- `/use` and `/i/*` are public, CORS-open endpoints. They must not set
  cookies, and they must not expose per-user data.
- No secrets or Clerk keys in client code. Public client values use `VITE_`.

## Correctness

- Image responses stay `private, no-store`: D1 `expires_at` is the source of
  truth for renewal, and the same R2 key is reused when an image regenerates.
- Generation keeps its guards in order: rate limit, generation lock, daily
  budget, then screenshot. The lock is always released.
- Schema changes come with a new file in `migrations/`; existing migrations
  are never edited.
- `wrangler.jsonc` changes are mirrored in the `previews` block when they add
  a storage binding, and come with regenerated `worker-configuration.d.ts`.
- Dev-only code (local Puppeteer, placeholder keys) stays behind
  `import.meta.env.DEV` or out of the Worker bundle.

## Tests

- New server logic has a unit test in `src/`, or an integration test in
  `tests/integration/` when it depends on D1, R2, or routing.
- UI flows that matter to signed-out visitors have a Playwright spec in `e2e/`.

Don't flag formatting or import order: Prettier and ESLint run in CI.
