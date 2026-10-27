import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { mosaicContent } from "./src/lib/content-plugin";
import { lazyChunks } from "./src/lib/lazy-chunks-plugin";

function validateSiteUrl(siteUrl: string | undefined) {
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
}

/**
 * Remote bindings proxy Browser Run calls to the real Cloudflare account, so
 * they need credentials. They are opt-in: on with `CLOUDFLARE_API_TOKEN` or
 * `MOSAIC_REMOTE_BINDINGS=1`, otherwise dev falls back to local Puppeteer.
 * `MOSAIC_REMOTE_BINDINGS=0` forces them off. Workers Builds' build token
 * can't reach them, so they always stay off there. The proxy also needs
 * `CLOUDFLARE_ACCESS_CLIENT_ID`/`_SECRET` when the account's workers.dev
 * subdomain is behind Cloudflare Access.
 */
function shouldUseRemoteBindings() {
  if (process.env.WORKERS_CI === "1") return false;
  const override = process.env.MOSAIC_REMOTE_BINDINGS;
  if (override) return override === "1" || override === "true";

  return Boolean(process.env.CLOUDFLARE_API_TOKEN);
}

/**
 * Points each Vadivam icon module at `src/lib/vadivam-icon.ts`, which renders
 * the same `<svg>` without the package's runtime sanitizer. Icons are still
 * imported from `vadivam-react` as usual.
 */
function vadivamLite(): Plugin {
  const lite = fileURLToPath(
    new URL("./src/lib/vadivam-icon.ts", import.meta.url),
  );
  return {
    name: "mosaic:vadivam-lite",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        source === "../createIcon.js" &&
        importer?.replaceAll("\\", "/").includes("/vadivam-react/dist/icons/")
      ) {
        return lite;
      }
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  validateSiteUrl(env.VITE_SITE_URL);

  return {
    build: {
      sourcemap: true,
    },
    define: {
      // Keys the signed-out page cache (src/start.ts) to this build.
      __MOSAIC_BUILD_ID__: JSON.stringify(Date.now().toString(36)),
      // Miniflare launches the local dev Chrome with an empty environment, so
      // it can't see HTTPS_PROXY. Sandboxes that require an egress proxy, like
      // Claude Code cloud sessions, need it passed to Puppeteer explicitly.
      __DEV_BROWSER_PROXY__: JSON.stringify(
        command === "serve" ? (process.env.HTTPS_PROXY ?? "") : "",
      ),
    },
    envPrefix: ["VITE_"],
    plugins: [
      vadivamLite(),
      lazyChunks(),
      mosaicContent(),
      cloudflare({
        viteEnvironment: { name: "ssr" },
        // Builds never need remote bindings, and a remote proxy that can't
        // authenticate (for example, a workers.dev subdomain behind Cloudflare
        // Access) would fail the whole `vite build`.
        remoteBindings: command === "serve" && shouldUseRemoteBindings(),
      }),
      ...tanstackStart({
        router: {
          generatedRouteTree: "./routeTree.gen.ts",
          routesDirectory: "./routes",
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
