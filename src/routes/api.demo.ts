import { createFileRoute } from "@tanstack/react-router";
import {
  corsHeaders,
  createJsonResponse,
  validateUrl,
  generateCacheKey,
  getR2Key,
  buildPublicImageUrl,
} from "@/lib/og-generation";
import puppeteer from "@cloudflare/puppeteer";
import { env } from "cloudflare:workers";
import { ensureWebsiteProtocol, extractUrlParts } from "@/lib/url";

// ── Metadata Extraction ─────────────────────────────────────────────

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

function extractMeta(
  html: string,
  attr: "property" | "name",
  names: string[],
): string | null {
  for (const name of names) {
    const regex = new RegExp(
      `<meta[^>]*${attr}=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      "i",
    );
    const match = html.match(regex);
    if (match?.[1]) {
      return normalizeText(match[1]);
    }
  }
  return null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] ? normalizeText(match[1]) : null;
}

function extractMetadata(html: string, baseUrl: URL) {
  const title =
    extractMeta(html, "property", ["og:title"]) ||
    extractMeta(html, "name", ["twitter:title", "title"]) ||
    extractTitleTag(html) ||
    "";

  const description =
    extractMeta(html, "property", ["og:description"]) ||
    extractMeta(html, "name", ["description", "twitter:description"]) ||
    "";

  let image =
    extractMeta(html, "property", ["og:image"]) ||
    extractMeta(html, "name", ["twitter:image", "twitter:image:src"]) ||
    "";

  if (image) {
    try {
      image = new URL(image, baseUrl).toString();
    } catch {
      // Keep original if it can't be normalized.
    }
  }

  return { title, description, image };
}

function getUserMessageForStatus(status: number): string {
  if (status === 403) {
    return "This website blocks automated requests. Please try a different URL.";
  }
  if (status === 404) {
    return "The requested page was not found. Please check the URL and try again.";
  }
  if (status === 502) {
    return "The website is currently experiencing issues. Please try again later.";
  }
  return "Failed to fetch metadata";
}

async function fetchPageHtml(url: URL): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MosaicBot/1.0; +https://mosaicimg.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    throw new Error(
      "Failed to fetch metadata. Please check the URL and try again.",
    );
  }

  if (!response.ok) {
    throw new Error(getUserMessageForStatus(response.status));
  }

  return response.text();
}

// ── Screenshot Helper ───────────────────────────────────────────────

async function takeScreenshot(url: string): Promise<ArrayBuffer> {
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1560, height: 819 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.addStyleTag({ content: "* { overflow: hidden; }" });
    const screenshot = await page.screenshot({ type: "png" });
    if (screenshot instanceof ArrayBuffer) {
      return screenshot;
    }
    const bytes = new Uint8Array(screenshot);
    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
  } finally {
    await browser.close();
  }
}

// ── Route Handler ───────────────────────────────────────────────────

export const Route = createFileRoute("/api/demo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const requestUrl = new URL(request.url);
          const url = requestUrl.searchParams.get("url");

          if (!url) {
            return createJsonResponse(
              { error: "URL parameter is required" },
              400,
            );
          }

          // Normalize URL
          let normalizedUrl: string;
          try {
            normalizedUrl = ensureWebsiteProtocol(url);
          } catch {
            return createJsonResponse(
              { error: "Please enter a valid website URL." },
              400,
            );
          }

          // Validate
          const { isValid, error } = validateUrl(normalizedUrl, true);
          if (!isValid) {
            return createJsonResponse({ error }, 400);
          }

          // Parse URL for metadata fetching
          let parsedUrl: URL;
          try {
            parsedUrl = new URL(normalizedUrl);
          } catch {
            return createJsonResponse(
              { error: "Invalid URL provided" },
              400,
            );
          }

          const { sanitizedUrl } = extractUrlParts(normalizedUrl);

          // Fetch metadata and generate screenshot in parallel
          const [metadata, screenshotResult] = await Promise.allSettled([
            fetchPageHtml(parsedUrl).then((html) =>
              extractMetadata(html, parsedUrl),
            ),
            (async () => {
              const cacheKey = await generateCacheKey(normalizedUrl);
              const imageKey = getR2Key(cacheKey, undefined, true);

              // Check R2 cache first
              const cached = await env.OG_BUCKET.head(imageKey);
              if (cached) {
                return {
                  imageUrl: buildPublicImageUrl(imageKey),
                  cached: true,
                };
              }

              // Take screenshot
              const imageBuffer = await takeScreenshot(normalizedUrl);

              // Store in R2
              try {
                await env.OG_BUCKET.put(imageKey, imageBuffer, {
                  httpMetadata: { contentType: "image/png" },
                });
                return {
                  imageUrl: buildPublicImageUrl(imageKey),
                  cached: false,
                };
              } catch {
                // R2 put failure — return base64 fallback
                const base64 = btoa(
                  String.fromCharCode(...new Uint8Array(imageBuffer)),
                );
                return {
                  imageUrl: `data:image/png;base64,${base64}`,
                  cached: false,
                };
              }
            })(),
          ]);

          // Extract metadata result
          const meta =
            metadata.status === "fulfilled"
              ? metadata.value
              : { title: "", description: "", image: "" };

          // Extract screenshot result
          let imageUrl: string | null = null;
          let screenshotError: string | undefined;

          if (screenshotResult.status === "fulfilled") {
            imageUrl = screenshotResult.value.imageUrl;
          } else {
            screenshotError =
              screenshotResult.reason instanceof Error
                ? screenshotResult.reason.message
                : "Failed to generate OG image";
          }

          return createJsonResponse(
            {
              normalizedUrl: sanitizedUrl,
              title: meta.title,
              description: meta.description,
              image: meta.image,
              imageUrl,
              ...(screenshotError ? { error: screenshotError } : {}),
            },
            200,
          );
        } catch {
          return createJsonResponse(
            { error: "Internal server error" },
            500,
          );
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      },
    },
  },
});
