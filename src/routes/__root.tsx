/// <reference types="vite/client" />

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { fetchClerkAuth, signInPath, signUpPath } from "@/lib/clerk-auth";
import {
  website_description,
  website_name,
  website_subtitle,
} from "@/lib/constants";
import { publicEnv } from "@/lib/env";
import { cn, getOgImageUrl } from "@/lib/utils";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Suspense, type ReactNode } from "react";
import { DefaultCatchBoundary } from "../components/default-catch-boundary";
import { NotFound } from "../components/not-found";
import appCss from "../styles/app.css?url";

export const Route = createRootRouteWithContext<{
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  queryClient: QueryClient;
}>()({
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
      { rel: "preconnect", href: "https://clerk.mosaicimg.com" },
      {
        rel: "preconnect",
        href: publicEnv.convexUrl,
        crossOrigin: "anonymous",
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    const { token, userId } = await fetchClerkAuth();

    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return { token, userId };
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
  const context = useRouteContext({ from: Route.id });

  return (
    <ClerkProvider
      publishableKey={publicEnv.clerkPublishableKey}
      signInUrl={signInPath}
      signUpUrl={signUpPath}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
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
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "touch-manipulation font-sans antialiased",
        "[font-feature-settings:'ss02','ss03','ss04','ss07','ss08','ss09']",
        "[text-rendering:optimizeLegibility]",
      )}
    >
      <head>
        <HeadContent />
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
