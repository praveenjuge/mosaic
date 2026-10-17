/**
 * Dev-only stand-in for the Browser Run `screenshot` Quick Action.
 *
 * `quickAction()` has no local emulation, but Miniflare's local `BROWSER`
 * binding can drive a downloaded Chrome through Puppeteer. This lets local
 * and Claude Code cloud sessions capture real screenshots without Cloudflare
 * credentials. Only imported behind `import.meta.env.DEV`, so it never ships
 * in the production Worker.
 */

import puppeteer, { type BrowserWorker } from "@cloudflare/puppeteer";

/** Egress proxy for local Chrome, injected by `vite.config.ts` in dev. */
declare const __DEV_BROWSER_PROXY__: string;

export async function takeLocalScreenshot(
  binding: BrowserRun,
  options: BrowserRunScreenshotOptions,
): Promise<ArrayBuffer> {
  if (!("url" in options)) {
    throw new Error("Local screenshots only support the `url` option.");
  }

  const browser = await puppeteer.launch(binding as unknown as BrowserWorker);
  try {
    const context = await browser.createBrowserContext(
      __DEV_BROWSER_PROXY__ ? { proxyServer: __DEV_BROWSER_PROXY__ } : {},
    );
    const page = await context.newPage();
    if (options.userAgent) await page.setUserAgent(options.userAgent);
    if (options.viewport) await page.setViewport(options.viewport);
    const rejected = (options.rejectRequestPattern ?? []).map(
      (pattern) => new RegExp(pattern),
    );
    if (rejected.length > 0) {
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (rejected.some((pattern) => pattern.test(request.url()))) {
          void request.abort();
        } else {
          void request.continue();
        }
      });
    }
    await page.goto(options.url, {
      waitUntil: options.gotoOptions?.waitUntil,
      timeout: options.gotoOptions?.timeout,
    });
    for (const { content, url } of options.addStyleTag ?? []) {
      if (content) await page.addStyleTag({ content });
      else if (url) await page.addStyleTag({ url });
    }

    const image = await page.screenshot({
      type: options.screenshotOptions?.type,
      quality: options.screenshotOptions?.quality,
    });
    return new Uint8Array(image).buffer;
  } finally {
    await browser.close();
  }
}
