import "@/app/globals.css";
import Aside from "@/components/aside";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = { themeColor: "#059669" };

export const metadata: Metadata = {
  title: "Mosaic",
  description: "Simplify Your Open Graph Image Creation.",
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
        className={`${GeistSans.variable} antialiased [font-family:var(--font-geist-sans)] [font-feature-settings:"ss02",_"ss03",_"ss04",_"ss07",_"ss08",_"ss09"] [font-synthesis:none] [text-rendering:optimizeLegibility] [touch-action:manipulation]`}
      >
        <body className="relative flex bg-background text-sm">
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
            <Aside />
            <main className="relative flex max-h-screen min-h-screen w-full flex-col gap-6 overflow-auto px-4 py-20 md:px-10 md:py-6">
              {children}
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
