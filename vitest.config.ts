import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "content-collections": path.resolve(
        __dirname,
        "./.content-collections/generated",
      ),
      // Stub Cloudflare-only modules so pure-function tests can import og-generation.ts
      "cloudflare:workers": path.resolve(
        __dirname,
        "src/lib/__mocks__/cloudflare-workers.ts",
      ),
      "@cloudflare/puppeteer": path.resolve(
        __dirname,
        "src/lib/__mocks__/cloudflare-puppeteer.ts",
      ),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
