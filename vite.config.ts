import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { mosaicContent } from "./src/lib/content-plugin";

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

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  validateSiteUrl(env.VITE_SITE_URL);

  return {
    build: {
      sourcemap: true,
    },
    define: {
      // Miniflare launches the local dev Chrome with an empty environment, so
      // it can't see HTTPS_PROXY. Sandboxes that require an egress proxy, like
      // Claude Code cloud sessions, need it passed to Puppeteer explicitly.
      __DEV_BROWSER_PROXY__: JSON.stringify(
        command === "serve" ? (process.env.HTTPS_PROXY ?? "") : "",
      ),
    },
    envPrefix: ["VITE_"],
    plugins: [
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
