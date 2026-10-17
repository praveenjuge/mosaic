import { clerkSetup } from "@clerk/testing/playwright";
import { execFileSync } from "node:child_process";

export default async function globalSetup() {
  const wrangler = (...args: string[]) =>
    execFileSync("bunx", ["wrangler", ...args], { stdio: "inherit" });

  wrangler("d1", "migrations", "apply", "DB", "--local");
  // Demo budgets persist in local D1 across runs; reset them so repeated
  // local runs don't hit the daily cap and get the example-image fallback.
  wrangler(
    "d1",
    "execute",
    "DB",
    "--local",
    "--command",
    "DELETE FROM generation_budgets",
  );
  // dashboard.spec.ts deletes the site it adds, but a failed run can leave
  // one behind; clear those so they don't pile up in the local dashboard.
  wrangler(
    "d1",
    "execute",
    "DB",
    "--local",
    "--command",
    "DELETE FROM sites WHERE url_base LIKE 'e2e-%.example.com'",
  );

  if (process.env.E2E_CLERK_USER_EMAIL) {
    await clerkSetup({
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    });
  }
}
