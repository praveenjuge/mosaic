import "@/app/globals.css";
import Aside from "@/components/aside";
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
    <ClerkProvider>
      <html
        lang="en"
        className={`${GeistSans.variable} antialiased [font-family:var(--font-geist-sans)] [font-synthesis:none] [text-rendering:optimizeLegibility] [touch-action:manipulation]`}
      >
        <body className="flex text-sm">
          <Aside />
          <main className="flex w-full flex-col gap-6 p-6 pt-16 md:pt-6">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
