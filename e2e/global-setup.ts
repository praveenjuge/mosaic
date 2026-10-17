import { clerkSetup } from "@clerk/testing/playwright";
import { chromium, type FullConfig } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { visualPages } from "./visual-pages";

export default async function globalSetup(config: FullConfig) {
  const wrangler = (...args: string[]) =>
    execFileSync("bunx", ["wrangler", ...args], { stdio: "inherit" });

  // Each wrangler process takes a second or two to start, so the cleanup
  // statements share one call.
  wrangler("d1", "migrations", "apply", "DB", "--local");
  wrangler(
    "d1",
    "execute",
    "DB",
    "--local",
    "--command",
    [
      // Demo budgets persist in local D1 across runs; reset them so repeated
      // local runs don't hit the daily cap and get the example-image fallback.
      "DELETE FROM generation_budgets;",
      // dashboard.spec.ts deletes the site it adds, but a failed run can leave
      // one behind; clear those so they don't pile up in the local dashboard.
      "DELETE FROM sites WHERE url_base LIKE 'e2e-%.example.com';",
    ].join(" "),
  );

  if (process.env.MOSAIC_VISUAL === "1") {
    // Playwright starts the dev server before this runs. Opening every page
    // once makes Vite compile its modules now, so the parallel visual specs
    // don't race the first compiles.
    const browser = await chromium.launch();
    const page = await browser.newPage();
    for (const { path } of visualPages) {
      await page.goto(new URL(path, config.webServer?.url).toString(), {
        waitUntil: "networkidle",
      });
    }
    await browser.close();
  }

  if (process.env.E2E_CLERK_USER_EMAIL) {
    await clerkSetup({
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    });
  }
}
