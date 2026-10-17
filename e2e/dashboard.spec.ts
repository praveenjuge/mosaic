import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

// Needs a Clerk development instance: real VITE_CLERK_PUBLISHABLE_KEY and
// CLERK_SECRET_KEY, plus E2E_CLERK_USER_EMAIL for an existing test user.
const emailAddress = process.env.E2E_CLERK_USER_EMAIL ?? "";

test.skip(!emailAddress, "Set E2E_CLERK_USER_EMAIL to run signed-in tests.");

// Local D1 may or may not already hold sites for the test user, so the test
// starts from either the empty state or the dashboard, adds a unique site,
// switches it to Kitesurf, and deletes it again.
test("signed-in users can manage a website", async ({ page }) => {
  const hostname = `e2e-${Date.now()}.example.com`;

  await page.goto("/help");
  await clerk.signIn({ page, emailAddress });
  await page.goto("/");

  const welcome = page.getByText("Welcome to Mosaic", { exact: true });
  const addWebsite = page.getByRole("button", {
    name: "Add Website",
    exact: true,
  });
  await expect(welcome.or(addWebsite)).toBeVisible();
  // Clicking before hydration would do nothing or fall through to a native
  // form GET.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const button = document.querySelector("main button");
        return (
          !!button &&
          Object.keys(button).some((key) => key.startsWith("__reactProps"))
        );
      }),
    )
    .toBe(true);

  if (await welcome.isVisible()) {
    await page.getByLabel("Website").fill(hostname);
    await page
      .getByRole("button", { name: "Add Website & Generate OG Images" })
      .click();
  } else {
    await addWebsite.click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Website").fill(hostname);
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
  }

  const row = page.getByRole("row").filter({ hasText: hostname });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Screenshot engine" }).hover();
  await page.getByRole("menuitemradio", { name: /Kitesurf/ }).click();
  await expect(row.getByText("Kitesurf", { exact: true })).toBeVisible();

  await row.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Yes, Delete" })
    .click();
  await expect(row).toHaveCount(0);
});
