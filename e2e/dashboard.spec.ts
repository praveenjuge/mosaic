import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

// Needs a Clerk development instance: real VITE_CLERK_PUBLISHABLE_KEY and
// CLERK_SECRET_KEY, plus E2E_CLERK_USER_EMAIL for an existing test user.
const emailAddress = process.env.E2E_CLERK_USER_EMAIL ?? "";

test.skip(!emailAddress, "Set E2E_CLERK_USER_EMAIL to run signed-in tests.");

test("signed-in users see the dashboard", async ({ page }) => {
  await page.goto("/help");
  await clerk.signIn({ page, emailAddress });
  await page.goto("/");
  await expect(page.getByText("Websites", { exact: true })).toBeVisible();
});
