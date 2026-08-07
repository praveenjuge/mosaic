/**
 * Ambient typings for the Browser Rendering (Browser Run) Workers binding
 * `quickAction()` method.
 *
 * Cloudflare shipped `env.BROWSER.quickAction()` on 2026-05-28, but the
 * bundled `workerd` runtime types in `worker-configuration.d.ts` still type
 * the `BROWSER` binding as a plain `Fetcher` (a type alias, so it can't be
 * augmented via declaration merging). This file declares the `quickAction`
 * surface we use so the binding can be cast and called type-safely.
 *
 * Remove this shim and the cast in `og-generation.ts` once the generated
 * runtime types include `quickAction`.
 *
 * @see https://developers.cloudflare.com/browser-run/quick-actions/
 * @see https://developers.cloudflare.com/browser-run/kitesurf/
 */

/** Browser engine for Browser Run Quick Actions. Defaults to Chromium. */
type BrowserRunEngine = "chromium" | "kitesurf";

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
  /**
   * Browser engine. Pass `"kitesurf"` to use Cloudflare's Workers-native
   * agent browser (maps to the REST `?browser=kitesurf` query param).
   */
  browser?: BrowserRunEngine;
  viewport?: BrowserRunViewport;
  gotoOptions?: BrowserRunGotoOptions;
  addStyleTag?: BrowserRunStyleTag[];
  screenshotOptions?: BrowserRunScreenshotOptions;
}

interface BrowserRunQuickActionInputMap {
  screenshot: BrowserRunScreenshotInput;
}

/**
 * The Browser Run binding surface for Quick Actions. Cast the `BROWSER`
 * binding (`env.BROWSER as unknown as BrowserRunBinding`) to call it.
 *
 * Requires a `browser` binding in `wrangler.jsonc` and a compatibility
 * date of `2026-03-24` or later.
 */
interface BrowserRunBinding {
  quickAction<A extends keyof BrowserRunQuickActionInputMap>(
    action: A,
    options: BrowserRunQuickActionInputMap[A],
  ): Promise<Response>;
}
