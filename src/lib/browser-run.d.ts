/**
 * Ambient typings for the Browser Run Workers binding surfaces we call.
 *
 * Cloudflare shipped `env.BROWSER.quickAction()` on 2026-05-28, but the
 * bundled `workerd` runtime types in `worker-configuration.d.ts` still type
 * the `BROWSER` binding as a plain `Fetcher` (a type alias, so it can't be
 * augmented via declaration merging). This file declares the binding surface
 * we use so casts stay type-safe.
 *
 * Remove this shim and the cast in `og-generation.ts` once the generated
 * runtime types include `BrowserRun` / `quickAction`.
 *
 * @see https://developers.cloudflare.com/browser-run/quick-actions/
 * @see https://developers.cloudflare.com/browser-run/kitesurf/
 */

interface BrowserRunViewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

interface BrowserRunStyleTag {
  content?: string;
  url?: string;
}

interface BrowserRunScreenshotOptions {
  type?: "png" | "jpeg" | "webp";
  quality?: number;
  fullPage?: boolean;
  omitBackground?: boolean;
}

interface BrowserRunGotoOptions {
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  timeout?: number;
}

interface BrowserRunScreenshotInput {
  url?: string;
  html?: string;
  selector?: string;
  userAgent?: string;
  viewport?: BrowserRunViewport;
  gotoOptions?: BrowserRunGotoOptions;
  addStyleTag?: BrowserRunStyleTag[];
  screenshotOptions?: BrowserRunScreenshotOptions;
}

interface BrowserRunQuickActionInputMap {
  screenshot: BrowserRunScreenshotInput;
}

/**
 * The Browser Run binding surface. Cast the `BROWSER` binding
 * (`env.BROWSER as unknown as BrowserRunBinding`) to call it.
 *
 * Requires a `browser` binding in `wrangler.jsonc` and a compatibility
 * date of `2026-03-24` or later for `quickAction`.
 *
 * Kitesurf is selected via the documented `?browser=kitesurf` query param on
 * the binding fetch URL (same pattern as CDP / REST), not as a body field.
 */
interface BrowserRunBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  quickAction<A extends keyof BrowserRunQuickActionInputMap>(
    action: A,
    options: BrowserRunQuickActionInputMap[A],
  ): Promise<Response>;
}
