import { readdirSync } from "node:fs";
import { extname } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { guides } from "./src/lib/help-guides";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, loadEnv } from "vite";

type PrerenderPage = {
  path: string;
  prerender?: { enabled: boolean };
  sitemap?: {
    changefreq?: "monthly" | "weekly" | "yearly";
    exclude?: boolean;
    priority?: number;
  };
};

function getHelpArticlePaths() {
  return readdirSync("./src/content/help")
    .filter((file) => extname(file) === ".md")
    .map((file) => `/help/${file.replace(/\.md$/, "")}`);
}

function resolveSiteHost(siteUrl: string) {
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteHost = resolveSiteHost(
    env.VITE_PUBLIC_SITE_URL ||
    env.NEXT_PUBLIC_SITE_URL ||
    (mode === "development" ? "http://localhost:3000" : "https://mosaicimg.com"),
  );

  const prerenderPages: PrerenderPage[] = [
    {
      path: "/",
      prerender: { enabled: true },
      sitemap: { changefreq: "weekly", priority: 1 },
    },
    {
      path: "/help",
      prerender: { enabled: true },
      sitemap: { changefreq: "weekly", priority: 0.9 },
    },
    {
      path: "/legal",
      prerender: { enabled: true },
      sitemap: { changefreq: "yearly", priority: 0.4 },
    },
    {
      path: "/blog",
      sitemap: { exclude: true },
    },
    {
      path: "/changelog",
      sitemap: { exclude: true },
    },
    {
      path: "/dashboard",
      sitemap: { exclude: true },
    },
    {
      path: "/sign-in",
      sitemap: { exclude: true },
    },
    {
      path: "/sign-up",
      sitemap: { exclude: true },
    },
    {
      path: "/use",
      sitemap: { exclude: true },
    },
    ...getHelpArticlePaths().map((path) => ({
      path,
      prerender: { enabled: true },
      sitemap: { changefreq: "monthly" as const, priority: 0.8 },
    })),
    ...guides.map((guide) => ({
      path: `/help/guides/${guide.slug}`,
      prerender: { enabled: true },
      sitemap: { changefreq: "monthly" as const, priority: 0.7 },
    })),
  ];

  return {
    build: {
      sourcemap: true,
    },
    envPrefix: ["VITE_", "NEXT_PUBLIC_", "CLERK_PUBLISHABLE_KEY"],
    plugins: [
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      ...tanstackStart({
        pages: prerenderPages,
        prerender: {
          autoStaticPathsDiscovery: true,
          autoSubfolderIndex: true,
          crawlLinks: true,
          enabled: true,
          failOnError: true,
          filter: (page) =>
            !["/dashboard", "/sign-in", "/sign-up", "/use"].some(
              (path) => page.path === path || page.path.startsWith(`${path}/`),
            ),
        },
        router: {
          generatedRouteTree: "./routeTree.gen.ts",
          routesDirectory: "./routes",
        },
        sitemap: {
          enabled: true,
          host: siteHost,
        },
        spa: {
          enabled: false,
        },
        srcDirectory: "src",
      }),
      react(),
      babel({
        presets: [reactCompilerPreset()],
      }),
      tailwindcss(),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 3000,
    },
  };
});
