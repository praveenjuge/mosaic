Mosaic is a SaaS platform that automatically generates Open Graph (OG) images for websites using screenshots. The application allows users to add their websites and automatically create beautiful social media preview images by taking screenshots of their web pages.

### Core Technologies

- **Framework**: Next.js (App Router) with React 19 TypeScript
- **Runtime**: Bun (package manager and runtime)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Convex
- **Authentication**: Clerk
- **Icons**: MynaUI Icons
- `convex` - Database and backend functions
- `@aws-sdk/client-s3` - AWS S3 services integration (v3)
- Build command: `bun run build`
- Development command: `bun dev`
- Linting command: `bun lint`

## Project Structure

```
app/                  # Next.js App Router pages
├── api/              # API routes
├── blog/             # Blog pages with markdown content
├── changelog/        # Changelog pages
├── help/             # Help and documentation
├── legal/            # Legal pages
└── settings/         # User settings, theme preferences, and subscription management

components/           # Reusable React components
├── home/            # Homepage-specific components
├── server/          # Server-side components
└── ui/              # shadcn/ui components

content/             # Markdown content
├── blog/           # Blog posts
├── changelog/      # Changelog entries
└── help/           # Help articles

lib/                # Utility functions and configurations
├── constants.ts    # Application constants
├── types.ts        # TypeScript type definitions
└── utils.ts        # Utility functions

convex/             # Convex schema, queries, mutations, actions
```

## Coding Standards & Best Practices

- Use strict TypeScript with proper type definitions
- Export types from `lib/types.ts` for reusability
- Use functional components with hooks
- Implement proper loading states with `<Skeleton>` components
- Use `Suspense` boundaries for data fetching
- Follow the pattern: SignedIn/SignedOut components for authentication states
- Server components by default, use "use client" only when necessary
- Use `SignedIn`, `SignedOut`, `ClerkLoaded`, `ClerkLoading` for auth states
- Use server-side client for data fetching in Server Components
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
- Use ESLint with Next.js configuration
- Format code with Prettier (organize imports, Tailwind class sorting)
- Uses Bun as the runtime and package manager
- All database operations should go through Convex
- Authentication is handled entirely by Clerk
- OG image generation is handled internally via Cloudflare Browser Rendering API
- Website URL format: always clean and normalize URLs before storage
- Suggest new instructions or improvements to this file as the project evolves.
