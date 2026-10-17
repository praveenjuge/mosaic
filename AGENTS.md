Mosaic is a SaaS platform that automatically generates Open Graph (OG) images for websites using screenshots. The application allows users to add their websites and automatically create beautiful social media preview images by taking screenshots of their web pages.

### Core Technologies

- **Framework**: TanStack Start with TanStack Router, Vite, and React 19 TypeScript
- **Runtime**: Bun (package manager and runtime)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Cloudflare D1 (SQLite), accessed via `env.DB` binding
- **Storage**: Cloudflare R2 for OG images, accessed via `env.OG_BUCKET` binding
- **Screenshots**: Cloudflare Browser Run via the `env.BROWSER` binding (`quickAction`), Kitesurf engine
- **Authentication**: Clerk (server-side JWT verification via `@clerk/tanstack-react-start/server`)
- **Analytics**: Workers Analytics Engine via `env.OG_ANALYTICS` (`src/lib/analytics.ts`)
- **Deployment Runtime**: Cloudflare Workers via Wrangler
- Build command: `bun run build`
- Development command: `bun run dev` (runs `vite dev` with Cloudflare plugin providing local D1/R2)
- Linting command: `bun run lint` (auto-fixes via eslint --fix)
- Formatting: `bun run format` (check only: `bun run format:check`)
- Apply local DB migrations: `bun run db:migrate:local`, then `bun run db:seed:local` to register `example.com` for `/use`
- Regenerate binding types after editing `wrangler.jsonc`: `bun run cf-typegen`

## Testing

Run `bun run check` before pushing. It runs everything CI (`.github/workflows/ci.yml`) runs, in order, and takes about three minutes. `bun run check:fast` runs only the lint, format, type, and unit steps. Stop any dev server on port 3000 first: with `CI=1`, Playwright won't reuse it.

- `bun run lint:check`, `bun run format:check`, `bun run typecheck`, `bun run cf-typegen:check`
- `bun run test` — Bun unit tests, colocated in `src/` as `*.test.ts(x)`.
- `bun run build && bun run test:integration` — the built Worker in workerd with local D1/R2, via wrangler's test harness under `node --test` (`tests/integration/`). Bun's fetch shim is incompatible with the harness, so these don't run under `bun test`. Browser Run is stripped there, so every screenshot fails like an outage; the harness can't override the `BROWSER` binding.
- `bun run test:e2e` — Playwright against `bun run dev` (`e2e/`). Signed-in specs (`e2e/dashboard.spec.ts`) skip unless a Clerk development instance and `E2E_CLERK_USER_EMAIL` are configured. They add and delete their own sites, so they work against any local D1 state.
- `bun run test:visual` — pixel baselines for signed-out pages (`e2e/visual.spec.ts`, images in `e2e/__screenshots__/`). `scripts/visual-test.sh` runs them in the pinned `mcr.microsoft.com/playwright` image (keep its tag in step with `@playwright/test`), with placeholder Clerk keys and strict comparison. Requests to other hosts are stubbed (images become grey squares), so third-party assets can't make results differ between machines. It needs Docker on a Linux host; in cloud sessions it starts `dockerd` itself, and the first run pulls the image (about a minute). After an intended UI change run `bun run test:visual:update`, look at the changed PNGs, and commit them with the change. On failure, the diffs are in `test-results/`.

## Local, cloud, and CI environments

- Remote bindings are opt-in and dev-only (`shouldUseRemoteBindings()` in `vite.config.ts`); `vite build` never uses them. In dev they turn on only when `CLOUDFLARE_API_TOKEN` is set or `MOSAIC_REMOTE_BINDINGS=1`, never in Workers Builds; `MOSAIC_REMOTE_BINDINGS=0` forces them off. A `wrangler login` alone is not detected.
- The account's workers.dev subdomain is behind Cloudflare Access, so the remote proxy also needs `CLOUDFLARE_ACCESS_CLIENT_ID` and `CLOUDFLARE_ACCESS_CLIENT_SECRET` (an Access service token). Without them `bun run dev` fails with "Failed to start the remote proxy session"; restart with `MOSAIC_REMOTE_BINDINGS=0`.
- Only `BROWSER` is remote; D1 and R2 always use local state in `.wrangler/`, so development never writes to production storage.
- Without remote bindings, `takeScreenshot()` falls back in dev to local Puppeteer (`src/lib/local-screenshot.ts`) against a Chrome that Miniflare downloads. Local Chrome needs `CI=1` when running as root (Miniflare only passes `--no-sandbox` then).
- Claude Code cloud sessions run `scripts/claude-session-start.sh` via the SessionStart hook in `.claude/settings.json`: it installs dependencies, writes placeholder Clerk keys to `.env.local`, migrates and seeds local D1, exports `CI=1`, and exports `MOSAIC_REMOTE_BINDINGS=0` unless the environment sets it or provides Access credentials. Sessions with more than one repository skip repository hooks, so run the script from the environment's setup script there. Placeholder keys use the `pk_live_` shape because Clerk development keys force a handshake redirect to the (fake) Frontend API.
- A PostToolUse hook (`scripts/claude-post-edit.sh`) runs Prettier on each file Claude edits and `bun run cf-typegen` after `wrangler.jsonc` changes.
- Deploys, remote migrations, and secret changes are denied to agents in `.claude/settings.json`; a human runs them.
- Worker Previews (`bun run deploy:preview`) use the `previews` block in `wrangler.jsonc`, bound to preview-only D1 (`mosaic-preview`), R2 (`mosaic-og-preview`), rate limiter namespaces, and Analytics Engine dataset.
- In cloud sessions the Cloudflare account is reachable through the claude.ai Cloudflare connector (D1, R2, Workers, docs). The `cloudflare-observability` server in `.mcp.json` needs an OAuth sign-in, so it only works in local sessions.
- The cloud environment can set real Clerk development keys (`VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) and `E2E_CLERK_USER_EMAIL` as environment variables. These take precedence over the placeholder `.env.local`, so the dev server signs in for real and the signed-in e2e specs run. Without them, signed-in pages can't be rendered in the cloud.

## Seeing changes

The user can't open a dev server that runs in a cloud container. After UI or generation changes, use the `run-mosaic` skill: start dev, call `/use`, screenshot pages with `node scripts/screenshot-pages.mjs`, look at the images, and send them to the user. The dev server also serves the Local Explorer API (`/cdn-cgi/local/explorer/api`) for local D1, R2, and SQL over request traces and logs.

## Building a feature

1. Schema change? Use the `new-migration` skill. New binding? Use `add-binding`.
2. Server logic goes in `src/server/` with Clerk auth, D1 `.bind()` parameters, and a unit or integration test (see `REVIEW.md`).
3. Run the app with `run-mosaic`, look at the result, and send screenshots to the user. For dashboard changes, drive the signed-in UI with a Playwright spec using `clerk.signIn` (see `e2e/dashboard.spec.ts`), and extend that spec when the flow matters.
4. Run `bun run check`. If only intended UI changed, update the visual baselines and review them.
5. Before opening a PR that touches `src/server`, `src/lib/url.ts`, `src/lib/og-generation.ts`, `/use`, `/i`, migrations, or `wrangler.jsonc`, run the `security-reviewer` subagent. If the PR adds a migration, its description should say that a human must run `bun run db:migrate:preview`.

Project skills and agents in `.claude/`:

- `run-mosaic` — run the app, generate images, screenshot pages, inspect local state
- `new-migration` — add a D1 migration the safe way
- `add-binding` — add a Cloudflare binding everywhere it must appear (production, previews, types, docs)
- `security-reviewer` subagent — checks a diff against `REVIEW.md` before a PR

## Project Structure

```
src/
├── routes/          # TanStack Start file-based routes
├── components/      # Reusable UI and route-specific presentation
├── server/          # Server functions (sites CRUD, stats, OG helpers)
├── content/         # Markdown content, rendered at build time by src/lib/content-plugin.ts
├── lib/             # Shared utilities, SEO, env, constants, db accessor
└── styles/          # Global app styles
migrations/          # Ordered Wrangler D1 migrations
public/              # Static assets
scripts/             # Claude Code hooks, page screenshots, and local D1 seed data
tests/integration/   # Built-Worker integration tests (node --test)
e2e/                 # Playwright end-to-end tests
.agents/skills/      # Vendored agent skills (TanStack Start, Cloudflare), linked from .claude/skills/
.claude/skills/      # Also holds Mosaic's own skills (run-mosaic, new-migration, add-binding)
.claude/agents/      # Subagents (security-reviewer)
```

## Coding Standards & Best Practices

- Use strict TypeScript with proper type definitions
- Export types from `lib/types.ts` for reusability
- Use functional components with hooks
- Implement proper loading states with `<Skeleton>` components
- Follow the pattern: SignedIn/SignedOut components for authentication states
- TanStack Start route files should stay focused on `validateSearch`, `beforeLoad`, `loader`, and `head`
- Keep route components in the route file; TanStack Start code-splits them automatically
- Markdown is rendered at build time by `src/lib/content-plugin.ts` into `virtual:mosaic-content/<collection>` modules. Import collections through `src/lib/content.ts` or `src/server/content.ts`, never the Markdown pipeline at runtime
- Handle errors gracefully with try/catch blocks
- Use Clerk `auth()` in server functions to enforce data access
- For DB schema changes, add a Wrangler D1 migration and apply it locally
- Use `getDb()` from `src/lib/db.ts` for D1 access in server functions
- Type D1 helper parameters as `D1Queryable` so they accept a Sessions API session. Use `withSession("first-unconstrained")` on read-heavy public paths so reads can hit read replicas
- Use `import { env } from "cloudflare:workers"` for R2 and other bindings
- Use shadcn/ui components consistently
- Show loading states during async operations
- Implement proper error boundaries and fallbacks
- Implement proper SEO metadata for all pages
- Use dynamic imports where appropriate
- Show user-friendly error messages
- Log errors appropriately without exposing sensitive data
- Use ESLint with the Vite/TanStack Start setup
- Format code with Prettier (organize imports, Tailwind class sorting)
- Uses Bun as the runtime and package manager
- All database operations go through D1 via `createServerFn` or direct queries in route handlers
- Authentication is handled entirely by Clerk
- OG image generation is handled internally via the Cloudflare Browser Run `BROWSER` Workers binding using `env.BROWSER.quickAction("screenshot", ...)` — no account ID or API token required. Every screenshot uses the engine in `SCREENSHOT_ENGINE` (`src/lib/constants.ts`): Kitesurf (`browser: "kitesurf"`), which is cheaper and free during its beta but not pixel-perfect and has no WebGL or video. Set it to `"chromium"` to go back to full Chrome. Kitesurf needs remote Browser Run: the local Puppeteer fallback always renders with Chrome, so check Kitesurf output on a Worker Preview.
- Public client environment variables must use the `VITE_` prefix
- Website URL format: always clean and normalize URLs before storage
- Suggest new instructions or improvements to this file as the project evolves.
