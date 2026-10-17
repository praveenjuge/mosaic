import { expect, test, type Page } from "@playwright/test";
import { visualPages } from "./visual-pages";

// Pixel baselines for signed-out pages. Rendering differs between Chromium
// builds and font stacks, so these only run inside the pinned Playwright
// image: `bun run test:visual` (and `:update` after an intended UI change).
// Baselines live in e2e/__screenshots__/.

// Third-party images (guide logos, favicons) load in CI but not in sandboxed
// containers, so every non-local request gets the same stand-in everywhere.
const placeholderImage = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#9ca3af"/></svg>`;

async function open(page: Page, path: string, theme: "light" | "dark") {
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) =>
      route.request().resourceType() === "image"
        ? route.fulfill({
            contentType: "image/svg+xml",
            body: placeholderImage,
          })
        : route.abort(),
  );
  // The app ignores the browser's color scheme and reads next-themes' key.
  await page.addInitScript((value) => {
    globalThis.localStorage.setItem("theme", value);
  }, theme);
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // The dev server's router devtools toggle isn't part of the app. It renders
  // in a shadow root that page CSS can't reach, so hide its host instead.
  await page.locator(".TanStackRouterDevtools").evaluate((element) => {
    const root = element.getRootNode();
    const host = root instanceof ShadowRoot ? root.host : element;
    (host as HTMLElement).style.display = "none";
  });
}

function screenshotOptions(page: Page) {
  return {
    fullPage: true,
    // The footer year comes from the server clock.
    mask: [page.getByText(/© \d{4}/)],
  };
}

for (const { name, path } of visualPages) {
  test(`${name} (desktop)`, async ({ page }) => {
    await open(page, path, "light");
    await expect(page).toHaveScreenshot(
      `${name}-desktop.png`,
      screenshotOptions(page),
    );
  });
}

test("home (mobile)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/", "light");
  await expect(page).toHaveScreenshot(
    "home-mobile.png",
    screenshotOptions(page),
  );
});

test("home (dark)", async ({ page }) => {
  await open(page, "/", "dark");
  await expect(page).toHaveScreenshot("home-dark.png", screenshotOptions(page));
});
