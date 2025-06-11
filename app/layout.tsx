import "@/app/globals.css";
import Footer from "@/components/footer";
import Header from "@/components/header";
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
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";

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
        className={`${GeistSans.variable} antialiased [font-family:var(--font-geist-sans)] [font-feature-settings:"ss02","ss03","ss04","ss07","ss08","ss09"] [text-rendering:optimizeLegibility] touch-manipulation`}
      >
        <body className="relative text-sm flex flex-col">
          <ThemeProvider
            enableSystem
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <div
              className="pointer-events-none fixed -right-48 -top-48 size-96 select-none bg-primary opacity-15 blur-3xl"
              aria-hidden="true"
            >
            </div>
            <Header />
            <main className="flex-1 space-y-6 px-4 py-6 md:px-10 max-w-6xl mx-auto w-full min-h-screen">
              {children}
            </main>
            <Footer />
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
