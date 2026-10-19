import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

// Needs a Clerk development instance: real VITE_CLERK_PUBLISHABLE_KEY and
// CLERK_SECRET_KEY, plus E2E_CLERK_USER_EMAIL for an existing test user.
const emailAddress = process.env.E2E_CLERK_USER_EMAIL ?? "";

test.skip(!emailAddress, "Set E2E_CLERK_USER_EMAIL to run signed-in tests.");

// Local D1 may or may not already hold sites for the test user, so the test
// starts from either the empty state or the dashboard, adds a unique site,
// and deletes it again.
test("signed-in users can add, edit, and delete a website", async ({
  page,
}) => {
  const hostname = `e2e-${Date.now()}.example.com`;

  // Signed-out pages don't load Clerk; the sign-in page does.
  await page.goto("/sign-in");
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
    .poll(
      () =>
        page.evaluate(() => {
          const button = document.querySelector("main button");
          return (
            !!button &&
            Object.keys(button).some((key) => key.startsWith("__reactProps"))
          );
        }),
      // A cold dev server can take a while to compile and hydrate the page.
      { timeout: 30_000 },
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

  let row = page.getByRole("row").filter({ hasText: hostname });
  await expect(row).toBeVisible();

  // Adding the same hostname again is refused.
  await addWebsite.click();
  const addDialog = page.getByRole("dialog");
  await addDialog.getByLabel("Website").fill(hostname);
  await addDialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(
    page.getByText("This website already exists in your list."),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  // Editing renames the row.
  const renamed = `renamed-${hostname}`;
  await row.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("Website").fill(renamed);
  await editDialog.getByRole("button", { name: /Save|Update/ }).click();
  row = page.getByRole("row").filter({ hasText: renamed });
  await expect(row).toBeVisible();

  // The made-up hostname has no images, so there is nothing to regenerate.
  await row.getByRole("button", { name: "Actions" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Regenerate images" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");

  await row.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Yes, Delete" })
    .click();
  await expect(row).toHaveCount(0);

  // Signing out reloads the route context, so the signed-out home replaces
  // the dashboard.
  await clerk.signOut({ page });
  await expect(
    page.getByRole("heading", { name: /Instant beautiful OG images/ }),
  ).toBeVisible();
  await expect(addWebsite).toHaveCount(0);
});
