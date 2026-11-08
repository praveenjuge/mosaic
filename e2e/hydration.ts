import { expect, type Page } from "@playwright/test";

/**
 * Wait until React has hydrated the first element matching `selector`.
 * Interacting before then does nothing, or falls through to a native form
 * GET. A cold dev server compiles a page on its first load, which can take
 * a while when other specs load pages at the same time.
 */
export async function waitForHydration(page: Page, selector: string) {
  await expect
    .poll(
      () =>
        page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return (
            !!element &&
            Object.keys(element).some((key) => key.startsWith("__reactProps"))
          );
        }, selector),
      { timeout: 30_000 },
    )
    .toBe(true);
}
