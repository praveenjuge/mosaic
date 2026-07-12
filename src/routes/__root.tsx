/// <reference types="vite/client" />

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  authenticatedHomePath,
  fetchRouteAuth,
  signInPath,
  signUpPath,
} from "@/lib/clerk-auth";
import {
  website_description,
  website_name,
  website_subtitle,
} from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import { buildOrganizationJsonLd } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/tanstack-react-start";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Suspense, type ReactNode } from "react";
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
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
      { rel: "apple-touch-icon", href: "/apple-icon.png" },
      { rel: "preconnect", href: "https://clerk.mosaic.praveenjuge.com" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    // Skip Clerk auth() call for API routes and static assets — they don't need it
    const skipAuthPaths = ["/use", "/robots.txt"];
    if (skipAuthPaths.some((p) => location.pathname === p)) {
      return { auth: { userId: null, isAuthenticated: false } };
    }

    return {
      auth: await fetchRouteAuth(),
    };
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
  return (
    <ClerkProvider
      publishableKey={publicEnv.clerkPublishableKey}
      signInUrl={signInPath}
      signUpUrl={signUpPath}
      signInFallbackRedirectUrl={authenticatedHomePath}
      signUpFallbackRedirectUrl={authenticatedHomePath}
    >
      <ThemeProvider
        enableSystem
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
      >
        <RootDocument>
          <Suspense>
            <Outlet />
          </Suspense>
        </RootDocument>
      </ThemeProvider>
    </ClerkProvider>
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
        <Toaster richColors />
        {import.meta.env.DEV ? (
          <TanStackRouterDevtools position="bottom-right" />
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
