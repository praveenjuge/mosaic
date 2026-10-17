import { expect, test, type Page } from "@playwright/test";

// Pixel baselines for signed-out pages. Rendering differs between Chromium
// builds and font stacks, so these only run inside the pinned Playwright
// image: `bun run test:visual` (and `:update` after an intended UI change).
// Baselines live in e2e/__screenshots__/.

async function open(page: Page, path: string, theme: "light" | "dark") {
  // The app ignores the browser's color scheme and reads next-themes' key.
  await page.addInitScript((value) => {
    globalThis.localStorage.setItem("theme", value);
  }, theme);
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
}

function screenshotOptions(page: Page) {
  return {
    fullPage: true,
    // The footer year comes from the server clock.
    mask: [page.getByText(/© \d{4}/)],
    // The dev server's router devtools toggle isn't part of the app.
    style: ".TanStackRouterDevtools { display: none !important; }",
  };
}

const pages = [
  { name: "home", path: "/" },
  { name: "help", path: "/help" },
  { name: "guide-nextjs", path: "/help/guides/nextjs" },
  { name: "legal", path: "/legal" },
  { name: "not-found", path: "/this-page-does-not-exist" },
];

for (const { name, path } of pages) {
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
