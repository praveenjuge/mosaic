/**
 * One screenshot attempt plus one retry. Production `/use` logs show Browser
 * Run failing transiently — empty-message throws from the binding that the
 * same URL's next request does not repeat — so a single retry recovers
 * generations that would otherwise be recorded as failed. Binding throws and
 * 429/5xx answers are retried; other 4xx answers reject the options or the
 * URL, so retrying them only costs a second browser run. A recovered failure
 * still logs a `[SCREENSHOT]` warning so intermittent Browser Run trouble
 * stays visible in Observability instead of disappearing into the retry.
 *
 * HTTP answers reject with `BrowserRunHttpError` so callers can tell a real
 * Browser Run response apart from the binding being unavailable (in dev the
 * local Puppeteer fallback only makes sense for the latter).
 */

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type QuickAction = (
  action: "screenshot",
  options: BrowserRunScreenshotOptions,
) => Promise<Response>;

export class BrowserRunHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BrowserRunHttpError";
    this.status = status;
  }
}

export const screenshotWithRetry = async (
  quickAction: QuickAction,
  options: BrowserRunScreenshotOptions,
): Promise<ArrayBuffer> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await quickAction("screenshot", options);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        console.warn(
          "[SCREENSHOT] Browser Run attempt failed, retrying once:",
          error,
        );
        await sleep(RETRY_DELAY_MS);
      }
      continue;
    }
    if (response.ok) {
      return response.arrayBuffer();
    }
    const message = await response.text().catch(() => "");
    lastError = new BrowserRunHttpError(
      response.status,
      `Browser Run returned ${response.status}: ${message}`,
    );
    if (response.status !== 429 && response.status < 500) {
      break;
    }
    if (attempt < MAX_ATTEMPTS) {
      console.warn(
        `[SCREENSHOT] Browser Run returned ${response.status}, retrying once`,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError;
};
