import "@/app/globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Footer from "@/components/footer";
import Header from "@/components/header/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  website_description,
  website_name,
  website_subtitle,
  website_url,
} from "@/lib/constants";
import { getOgImageUrl } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`touch-manipulation antialiased [font-feature-settings:"ss02","ss03","ss04","ss07","ss08","ss09"] [text-rendering:optimizeLegibility]`}
    >
      <body className="relative flex flex-col text-sm">
        <ThemeProvider
          enableSystem
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <ClerkProvider telemetry={false}>
            <ConvexClientProvider>
              <div
                className="bg-primary pointer-events-none fixed -top-48 -right-48 size-96 opacity-15 blur-3xl select-none"
                aria-hidden="true"
              ></div>
              <Header />
              <Suspense>
                <main className="mx-auto min-h-screen w-full max-w-6xl flex-1 space-y-10 px-4 pt-10 pb-6 md:px-10">
                  {children}
                </main>
              </Suspense>
              <Footer />
              <Toaster richColors />
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
