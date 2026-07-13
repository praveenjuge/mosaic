import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

function resolveSiteHost(siteUrl: string | undefined) {
  if (!siteUrl) {
    throw new Error("VITE_SITE_URL is required.");
  }

  const parsed = new URL(siteUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("VITE_SITE_URL must use HTTP or HTTPS.");
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("VITE_SITE_URL must be an origin without a path or query.");
  }

  return parsed.origin;
}

const prerenderBlockedPaths = [
  "/",
  "/dashboard",
  "/sign-in",
  "/sign-up",
  "/use",
  "/i",
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
  const siteHost = resolveSiteHost(env.VITE_SITE_URL);

  return {
    build: {
      sourcemap: true,
    },
    envPrefix: ["VITE_"],
    plugins: [
      cloudflare({ viteEnvironment: { name: "ssr" } }),
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
