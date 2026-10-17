/// <reference types="vite/client" />

import { getRouteAuth } from "@/lib/clerk-auth";
import { clerkShell, needsClerk, preloadClerkChunks } from "@/lib/clerk-chunks";
import {
  website_description,
  website_name,
  website_subtitle,
} from "@/lib/constants";
import { buildOrganizationJsonLd } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { cn } from "@/lib/utils";
import geistLatin from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useMatches,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import { Suspense, useState, type ReactNode } from "react";
import { DefaultCatchBoundary } from "../components/default-catch-boundary";
import { NotFound } from "../components/not-found";
import appCss from "../styles/app.css?url";

// The root router context is intentionally empty; child routes augment it via
// `beforeLoad` (see `auth`). `{}` is required here for that augmentation to work.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const Route = createRootRouteWithContext<{}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { title: `${website_name} - ${website_subtitle}` },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "description",
        content: website_description,
      },
      {
        name: "theme-color",
        content: "#059669",
      },
      {
        name: "application-name",
        content: website_name,
      },
      {
        property: "og:site_name",
        content: website_name,
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:image",
        content: getOgImageUrl(""),
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:image",
        content: getOgImageUrl(""),
      },
    ],
    links: [
      // The stylesheet names this font, so without a preload the browser
      // only requests it after downloading and parsing the CSS.
      {
        rel: "preload",
        href: geistLatin,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
      { rel: "apple-touch-icon", href: "/apple-icon.png" },
    ],
  }),
  // Server-handler routes (/use, /i/*, robots.txt) answer before
  // the router runs, so this never runs for them.
  beforeLoad: async ({ location }) => {
    const auth = await getRouteAuth();
    await preloadClerkChunks(auth, location.pathname);
    return { auth };
  },
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: NotFound,
  component: RootComponent,
});

function RootComponent() {
  const { auth } = Route.useRouteContext();
  // The rendered page's path, not a pending navigation's.
  const pathname = useMatches({
    select: (matches) => matches.at(-1)?.pathname ?? "/",
  });
  const clerkNeeded = needsClerk(auth, pathname);
  // Once Clerk has started, keep it: signing out mid-session still needs it,
  // and unmounting would remount the page.
  const [clerkStarted, setClerkStarted] = useState(clerkNeeded);
  if (clerkNeeded && !clerkStarted) setClerkStarted(true);

  const page = (
    <Suspense>
      <Outlet />
    </Suspense>
  );

  return (
    <ThemeProvider
      enableSystem
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <RootDocument>
        {clerkNeeded || clerkStarted ? (
          <Suspense>
            <clerkShell.Component>{page}</clerkShell.Component>
          </Suspense>
        ) : (
          page
        )}
      </RootDocument>
    </ThemeProvider>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const organizationJsonLd = JSON.stringify(buildOrganizationJsonLd());
  const shouldRenderStructuredData = typeof document === "undefined";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "touch-manipulation font-sans antialiased",
        "font-features-['ss02','ss03','ss04','ss07','ss08','ss09']",
        "[text-rendering:optimizeLegibility]",
      )}
    >
      <head>
        <HeadContent />
        {shouldRenderStructuredData ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
          />
        ) : null}
      </head>
      <body className="relative flex min-h-screen flex-col text-sm">
        {children}
        {import.meta.env.DEV ? (
          <TanStackRouterDevtools position="bottom-right" />
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
