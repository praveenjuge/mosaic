import "@/app/globals.css";
import Aside from "@/components/aside";
import { OnboardingCard } from "@/components/onboarding-card";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import {
  website_description,
  website_name,
  website_subtitle,
  website_url,
} from "@/lib/constants";
import { getOgImageUrl } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

export const experimental_ppr = true;

export const viewport: Viewport = { themeColor: "#059669" };

export const metadata: Metadata = {
  metadataBase: new URL(website_url),
  description: website_description,
  applicationName: website_name,
  title: {
    template: `%s - ${website_name} - ${website_subtitle}`,
    default: website_name + " - " + website_subtitle,
  },
  openGraph: {
    images: [getOgImageUrl("")],
  },
  robots: {
    follow: true,
    index: true,
  },
  alternates: {
    canonical: "./",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider telemetry={false}>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${GeistSans.variable} antialiased [font-family:var(--font-geist-sans)] [font-feature-settings:"ss02",_"ss03",_"ss04",_"ss07",_"ss08",_"ss09"] [text-rendering:optimizeLegibility] [touch-action:manipulation]`}
      >
        <body className="relative text-sm">
          <ThemeProvider
            enableSystem
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <div
              className="pointer-events-none fixed -right-48 -top-48 size-96 select-none bg-primary opacity-15 blur-3xl"
              aria-hidden="true"
            ></div>
            <SidebarProvider>
              <Aside />
              <SidebarInset>
                <SidebarTrigger />
                {children}
              </SidebarInset>
            </SidebarProvider>
            <Suspense fallback={<></>}>
              <OnboardingCard />
            </Suspense>
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
