Mosaic is a SaaS platform that automatically generates Open Graph (OG) images for websites using screenshots. The application allows users to add their websites and automatically create beautiful social media preview images by taking screenshots of their web pages.

### Core Technologies

- **Framework**: TanStack Start with TanStack Router, Vite, and React 19 TypeScript
- **Runtime**: Bun (package manager and runtime)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Cloudflare D1 (SQLite), accessed via `env.DB` binding
- **Storage**: Cloudflare R2 for OG images, accessed via `env.OG_BUCKET` binding
- **Screenshots**: Cloudflare Browser Run via the `env.BROWSER` binding (`quickAction`), Chromium default
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

Run these before pushing; CI (`.github/workflows/ci.yml`) runs all of them.

- `bun run lint:check`, `bun run format:check`, `bun run typecheck`, `bun run cf-typegen:check`
- `bun run test` — Bun unit tests, colocated in `src/` as `*.test.ts(x)`
- `bun run build && bun run test:integration` — the built Worker in workerd with local D1/R2, via wrangler's test harness under `node --test` (`tests/integration/`). Bun's fetch shim is incompatible with the harness, so these don't run under `bun test`.
- `bun run test:e2e` — Playwright against `bun run dev` (`e2e/`). Signed-in specs skip unless a Clerk development instance and `E2E_CLERK_USER_EMAIL` are configured.

## Local, cloud, and CI environments

- Remote bindings are opt-in (`shouldUseRemoteBindings()` in `vite.config.ts`). They turn on for a logged-in machine or when `CLOUDFLARE_API_TOKEN` is set, and stay off in CI, Workers Builds, and Claude Code cloud sessions. `MOSAIC_REMOTE_BINDINGS=1|0` overrides.
- Only `BROWSER` is remote; D1 and R2 always use local state in `.wrangler/`, so development never writes to production storage.
- Without remote bindings, `takeScreenshot()` falls back in dev to local Puppeteer (`src/lib/local-screenshot.ts`) against a Chrome that Miniflare downloads. Local Chrome needs `CI=1` when running as root (Miniflare only passes `--no-sandbox` then).
- Claude Code cloud sessions run `scripts/claude-session-start.sh` via the SessionStart hook in `.claude/settings.json`: it installs dependencies, writes placeholder Clerk keys to `.env.local`, migrates and seeds local D1, and exports `CI=1`. Placeholder keys use the `pk_live_` shape because Clerk development keys force a handshake redirect to the (fake) Frontend API.
- Deploys, remote migrations, and secret changes are denied to agents in `.claude/settings.json`; a human runs them.
- Worker Previews (`bun run deploy:preview`) use the `previews` block in `wrangler.jsonc`, bound to preview-only D1 (`mosaic-preview`), R2 (`mosaic-og-preview`), rate limiter namespaces, and Analytics Engine dataset.

## Project Structure

```
src/
├── routes/          # TanStack Start file-based routes and lazy route modules
├── components/      # Reusable UI and route-specific presentation
├── server/          # Server functions (sites CRUD, stats, OG helpers)
├── content/         # Markdown content sources
├── generated/       # Build-time generated typed content manifests
├── lib/             # Shared utilities, SEO, env, constants, db accessor
└── styles/          # Global app styles
migrations/          # Ordered Wrangler D1 migrations
public/              # Static assets
scripts/             # Session-start hook and local D1 seed data
tests/integration/   # Built-Worker integration tests (node --test)
e2e/                 # Playwright end-to-end tests
.agents/skills/      # Agent skills (TanStack Start, Cloudflare), linked from .claude/skills/
```

## Coding Standards & Best Practices

- Use strict TypeScript with proper type definitions
- Export types from `lib/types.ts` for reusability
- Use functional components with hooks
- Implement proper loading states with `<Skeleton>` components
- Follow the pattern: SignedIn/SignedOut components for authentication states
- TanStack Start route files should stay focused on `validateSearch`, `beforeLoad`, `loader`, and `head`
- Prefer lazy route companions for heavy route components
- Keep build-time content processing out of the route runtime path
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
- OG image generation is handled internally via the Cloudflare Browser Run `BROWSER` Workers binding using `env.BROWSER.quickAction("screenshot", ...)` — no account ID or API token required. The engine comes from `SCREENSHOT_ENGINE` in `src/lib/constants.ts`: Chromium by default, or Kitesurf (`browser: "kitesurf"`), which is cheaper but not pixel-perfect.
- Public client environment variables must use the `VITE_` prefix
- Website URL format: always clean and normalize URLs before storage
- Suggest new instructions or improvements to this file as the project evolves.
