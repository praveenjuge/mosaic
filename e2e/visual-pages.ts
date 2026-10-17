import type { Page } from "@playwright/test";

// Signed-out pages with visual baselines (visual.spec.ts). global-setup.ts
// opens each one first so the dev server's compiles finish before the specs
// take screenshots in parallel.
export const visualPages = [
  { name: "home", path: "/" },
  { name: "help", path: "/help" },
  { name: "guide-nextjs", path: "/help/guides/nextjs" },
  { name: "legal", path: "/legal" },
  { name: "not-found", path: "/this-page-does-not-exist" },
];

// Third-party images (guide logos, favicons) load in CI but not in sandboxed
// containers, so every non-local request gets the same stand-in everywhere,
// including global-setup.ts's warm-up, which a stalled host would otherwise
// time out.
const placeholderImage = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#9ca3af"/></svg>`;

export async function stubOutsideRequests(page: Page): Promise<void> {
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
}
