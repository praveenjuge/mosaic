import { expect, test } from "@playwright/test";
import { waitForHydration } from "./hydration";

test("home page renders the hero", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Instant beautiful OG images from your website/,
    }),
  ).toBeVisible();
});

test("signed-out pages link to sign-in without loading Clerk", async ({
  page,
}) => {
  // Clerk development instances still redirect the page itself through a
  // handshake, so only count scripts and API calls.
  const clerkRequests: string[] = [];
  page.on("request", (request) => {
    if (
      request.resourceType() !== "document" &&
      /clerk/i.test(new URL(request.url()).hostname)
    ) {
      clerkRequests.push(request.url());
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(clerkRequests).toEqual([]);
  expect(await page.evaluate(() => "Clerk" in window)).toBe(false);

  await page.getByRole("link", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/sign-in\/?$/);
});

test("live demo generates a screenshot", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page, "form");
  await page.getByLabel("Enter URL for OG image preview").fill("example.com");
  await page.getByRole("button", { name: "Generate preview" }).click();

  const image = page.getByAltText("Mosaic Open Graph Image");
  await expect(image).toHaveAttribute("src", /^data:image\/jpeg;base64,/, {
    timeout: 60_000,
  });
  // The page's CSP must allow the inline screenshot to render.
  await expect
    .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
});

test("help center lists guides", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByText("Help & Support")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Use the Mosaic API" }),
  ).toBeVisible();
});
