Mosaic is a SaaS platform that automatically generates Open Graph (OG) images for websites using screenshots. The application allows users to add their websites and automatically create beautiful social media preview images by taking screenshots of their web pages.

### Core Technologies

- **Framework**: TanStack Start with TanStack Router, Vite, and React 19 TypeScript
- **Runtime**: Bun (package manager and runtime)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Cloudflare D1 (SQLite), accessed via `env.DB` binding
- **Storage**: Cloudflare R2 for OG images, accessed via `env.OG_BUCKET` binding
- **Screenshots**: Cloudflare Browser Run via the `env.BROWSER` binding (`quickAction`), Chromium default
- **Authentication**: Clerk (server-side JWT verification via `@clerk/tanstack-react-start/server`)
- **Deployment Runtime**: Cloudflare Workers via Wrangler
- Build command: `bun run build`
- Development command: `bun run dev` (runs `vite dev` with Cloudflare plugin providing local D1/R2)
- Linting command: `bun run lint` (auto-fixes via eslint --fix)
- Apply local DB migrations: `bun run db:migrate:local`

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
- OG image generation is handled internally via the Cloudflare Browser Run `BROWSER` Workers binding using `env.BROWSER.quickAction("screenshot", ...)` — Chromium by default, no account ID or API token required. Kitesurf (`?browser=kitesurf`) is REST/CDP-only until the Quick Action binding exposes an engine selector.
- Public client environment variables must use the `VITE_` prefix
- Website URL format: always clean and normalize URLs before storage
- Suggest new instructions or improvements to this file as the project evolves.
