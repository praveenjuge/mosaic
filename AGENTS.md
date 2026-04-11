Mosaic is a SaaS platform that automatically generates Open Graph (OG) images for websites using screenshots. The application allows users to add their websites and automatically create beautiful social media preview images by taking screenshots of their web pages.

## Rules

- After generating code do `bun run predev` and `bun run build` to check if everything works.

### Core Technologies

- **Framework**: TanStack Start with TanStack Router, Vite, and React 19 TypeScript
- **Runtime**: Bun (package manager and runtime)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Convex
- **Authentication**: Clerk
- **Deployment Runtime**: Cloudflare via Wrangler
- `convex` - Database and backend functions
- Build command: `bun run build`
- Development command: `bun run dev` (generates content, then runs Convex + Vite concurrently)
- Linting command: `bun run lint` (auto-fixes via eslint --fix)

## Project Structure

```
src/
├── routes/          # TanStack Start file-based routes and lazy route modules
├── components/      # Reusable UI and route-specific presentation
├── content/         # Markdown content sources
├── generated/       # Build-time generated typed content manifests
├── lib/             # Shared utilities, SEO, env, and constants
└── styles/          # Global app styles

scripts/             # Build-time generators such as content manifest creation
convex/              # Convex schema, queries, mutations, actions
public/              # Static assets
```

## Coding Standards & Best Practices

- Use strict TypeScript with proper type definitions
- Export types from `lib/types.ts` for reusability
- Use functional components with hooks
- Implement proper loading states with `<Skeleton>` components
- Use `Suspense` only when a boundary actually wraps async or lazy work
- Follow the pattern: SignedIn/SignedOut components for authentication states
- TanStack Start route files should stay focused on `validateSearch`, `beforeLoad`, `loader`, and `head`
- Prefer lazy route companions for heavy route components
- Keep build-time content processing out of the route runtime path
- Handle errors gracefully with try/catch blocks
- Use Convex auth checks (ctx.auth) to enforce data access
- For any db schema changes, update Convex schema and regenerate codegen
- Use shadcn/ui components consistently
- Show loading states during async operations
- Follow the card-based layout pattern
- Implement proper error boundaries and fallbacks
- Implement proper SEO metadata for all pages
- Use dynamic imports where appropriate
- Implement proper loading states
- Show user-friendly error messages
- Log errors appropriately without exposing sensitive data
- Use ESLint with the Vite/TanStack Start setup
- Format code with Prettier (organize imports, Tailwind class sorting)
- Uses Bun as the runtime and package manager
- All database operations should go through Convex
- Authentication is handled entirely by Clerk
- OG image generation is handled internally via Cloudflare Browser Rendering API
- Public client environment variables must use the `VITE_` prefix
- Website URL format: always clean and normalize URLs before storage
- Suggest new instructions or improvements to this file as the project evolves.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
