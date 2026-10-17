import { expect, test } from "@playwright/test";

test("home page renders the hero", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Instant beautiful OG images from your website/,
    }),
  ).toBeVisible();
});

test("live demo generates a screenshot", async ({ page }) => {
  await page.goto("/");
  // Submitting before hydration would fall through to a native form GET.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const form = document.querySelector("form");
        return (
          !!form &&
          Object.keys(form).some((key) => key.startsWith("__reactProps"))
        );
      }),
    )
    .toBe(true);
  await page.getByLabel("Enter URL for OG image preview").fill("example.com");
  await page
    .getByRole("button", { name: /Get a Live Demo of your new OG Image/ })
    .click();

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
