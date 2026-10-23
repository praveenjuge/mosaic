import { blockedRequestPatterns } from "@/lib/blocked-requests";
import { CONSENT_BANNER_CSS } from "@/lib/consent-banners";
import { SCREENSHOT_ENGINE } from "@/lib/constants";
import { MOSAIC_RENDERER_USER_AGENT } from "@/lib/request";
import { screenshotWithRetry } from "@/lib/screenshot-retry";
import { env } from "cloudflare:workers";

/**
 * Take a JPEG screenshot of the given URL via the Cloudflare Browser Run
 * `screenshot` Quick Action, called directly through the `BROWSER` Workers
 * binding (`env.BROWSER.quickAction`).
 *
 * The engine comes from `SCREENSHOT_ENGINE`: Kitesurf (the binding's
 * `browser: "kitesurf"` option), or Chromium when that is set to "chromium".
 *
 * Using the binding talks to Browser Run directly over Cloudflare's network —
 * no account ID or API token required. Requires a compatibility date of
 * `2026-03-24` or later and a `browser` binding in `wrangler.jsonc`.
 *
 * Uses `networkidle2` (≤ 2 open connections for 500 ms) instead of
 * `networkidle0` to avoid stalling on sites with persistent connections
 * (analytics beacons, websockets, long-polling), and blocks known tracker
 * hosts and media so the network goes idle sooner. Consent platforms are
 * blocked too, and `CONSENT_BANNER_CSS` hides self-hosted banners.
 * `bestAttempt` takes the screenshot anyway when a page never goes idle
 * within the timeout, instead of failing after it. The timeout leaves room for the page fetch inside the
 * ~30 s a background refresh gets after its response.
 *
 * In dev without remote bindings, `quickAction()` is unavailable, so the
 * same options run through local Puppeteer instead.
 */
export async function takeScreenshot(url: string): Promise<ArrayBuffer> {
  const options: BrowserRunScreenshotOptions = {
    url,
    ...(SCREENSHOT_ENGINE === "kitesurf" ? { browser: "kitesurf" } : {}),
    userAgent: MOSAIC_RENDERER_USER_AGENT,
    viewport: { width: 1560, height: 819 },
    gotoOptions: { waitUntil: "networkidle2", timeout: 10_000 },
    bestAttempt: true,
    rejectRequestPattern: blockedRequestPatterns(url),
    rejectResourceTypes: ["media"],
    addStyleTag: [
      { content: "* { overflow: hidden; }" },
      { content: CONSENT_BANNER_CSS },
    ],
    screenshotOptions: { type: "jpeg", quality: 80 },
  };

  try {
    return await screenshotWithRetry(
      env.BROWSER.quickAction.bind(env.BROWSER),
      options,
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      const { takeLocalScreenshot } = await import("@/lib/local-screenshot");
      return takeLocalScreenshot(env.BROWSER, options);
    }
    throw error;
  }
}
