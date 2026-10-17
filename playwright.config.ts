import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const port = 3000;

// Claude Code cloud containers ship a preinstalled Chromium and block
// Playwright's own browser download, so reuse it there.
const cloudChromium = "/opt/pw-browsers/chromium";
const executablePath =
  process.env.CLAUDE_CODE_REMOTE === "true" && existsSync(cloudChromium)
    ? cloudChromium
    : undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  // Specs don't share state (signed-in ones add and delete their own sites),
  // so they run side by side against the one dev server.
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  // Visual baselines are only valid in the pinned Playwright image, so the
  // visual project exists only when scripts/visual-test.sh runs it there.
  // That image renders identically run to run, so comparisons stay strict.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  projects: [
    {
      name: "chromium",
      testIgnore: "visual.spec.ts",
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } },
    },
    ...(process.env.MOSAIC_VISUAL === "1"
      ? [
          {
            name: "visual",
            testMatch: "visual.spec.ts",
            // One page at a time keeps the dev server's first compiles from
            // racing the screenshots.
            fullyParallel: false,
            use: { ...devices["Desktop Chrome"] },
          },
        ]
      : []),
  ],
  // The dev server is used, not `vite preview`, because only dev falls back
  // to local Puppeteer when Browser Run Quick Actions are unavailable.
  webServer: {
    command: "bun run dev",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
