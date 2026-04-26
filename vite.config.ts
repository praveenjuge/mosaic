import { cloudflare } from "@cloudflare/vite-plugin";
import contentCollections from "@content-collections/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";

function resolveSiteHost(siteUrl: string) {
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
}

const prerenderBlockedPaths = [
  "/",
  "/dashboard",
  "/sign-in",
  "/sign-up",
  "/use",
];

const staticAssetPattern =
  /\.(avif|css|gif|ico|jpe?g|js|json|map|png|svg|webp|woff2?)$/i;

function exitAfterCloudflarePrerender(): Plugin {
  return {
    name: "mosaic:exit-after-cloudflare-prerender",
    apply: "build",
    enforce: "post",
    buildApp: {
      order: "post",
      async handler() {
        if (process.env.TSS_PRERENDERING !== "true") return;

        // Cloudflare's prerender preview can leave workerd handles open after the sitemap is written.
        setImmediate(() => {
          process.exit(process.exitCode ?? 0);
        });
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteHost = resolveSiteHost(
    env.VITE_SITE_URL ||
      (mode === "development" ? "http://localhost:3000" : "https://mosaicimg.com"),
  );

  return {
    build: {
      sourcemap: true,
    },
    envPrefix: ["VITE_"],
    plugins: [
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      contentCollections(),
      ...tanstackStart({
        pages: [{ path: "/help" }, { path: "/legal" }],
        prerender: {
          autoStaticPathsDiscovery: true,
          autoSubfolderIndex: true,
          crawlLinks: true,
          enabled: true,
          failOnError: true,
          filter: (page) => {
            if (staticAssetPattern.test(page.path)) return false;

            return !prerenderBlockedPaths.some(
              (path) => page.path === path || page.path.startsWith(`${path}/`),
            );
          },
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
      exitAfterCloudflarePrerender(),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 3000,
    },
  };
});
