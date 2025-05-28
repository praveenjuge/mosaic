import { load } from "cheerio";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface MetaTags {
  title: string;
  description: string;
  image: string;
}

// Extract meta tags from HTML
function extractMetaTags(html: string, url: string): MetaTags {
  const $ = load(html);

  // Get title
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text() ||
    "";

  // Get description
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  // Get image
  let image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    "";

  // Make image URL absolute if it's relative
  if (image && !image.startsWith("http")) {
    try {
      const baseUrl = new URL(url);
      image = new URL(image, baseUrl.origin).toString();
    } catch (e) {
      console.error("Error making image URL absolute:", e);
    }
  }

  return {
    title: title.trim(),
    description: description.trim(),
    image: image.trim(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 },
      );
    }

    // Validate URL
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      if (!["http:", "https:"].includes(validatedUrl.protocol)) {
        return NextResponse.json(
          { error: "Only HTTP and HTTPS URLs are supported" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 },
      );
    }

    // Security check for localhost in production
    const hostname = validatedUrl.hostname.toLowerCase();
    const blockedDomains = ["localhost", "127.0.0.1", "0.0.0.0"];
    const isLocalhost = blockedDomains.some(
      (domain) => hostname === domain || hostname.includes(domain),
    );

    if (isLocalhost && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Local URLs are not allowed" },
        { status: 400 },
      );
    }

    console.log(`Fetching metadata for: ${url}`);

    // Fetch the webpage
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific status codes with more user-friendly messages
        let errorMessage = `Failed to fetch URL: ${response.status} ${response.statusText}`;
        let statusCode = 400;

        if (response.status === 999) {
          errorMessage =
            "This website blocks automated requests. Please try a different URL.";
          statusCode = 403;
        } else if (response.status === 403) {
          errorMessage =
            "Access to this website is forbidden. The site may have anti-bot protection.";
          statusCode = 403;
        } else if (response.status === 404) {
          errorMessage = "The requested page was not found.";
          statusCode = 404;
        } else if (response.status >= 500) {
          errorMessage =
            "The website is currently experiencing issues. Please try again later.";
          statusCode = 502;
        }

        console.log(
          `Fetch failed for ${url}: ${response.status} ${response.statusText}`,
        );

        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode },
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return NextResponse.json(
          {
            error: "URL does not return HTML content",
          },
          { status: 400 },
        );
      }

      const html = await response.text();
      const metaTags = extractMetaTags(html, url);

      // Provide fallbacks
      if (!metaTags.title) {
        metaTags.title = validatedUrl.hostname;
      }

      if (!metaTags.description) {
        metaTags.description = `Visit ${validatedUrl.hostname}`;
      }

      console.log(`Successfully extracted metadata for ${url}:`, {
        title: metaTags.title.substring(0, 50) + "...",
        description: metaTags.description.substring(0, 50) + "...",
        hasImage: !!metaTags.image,
      });

      return NextResponse.json(metaTags);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout" }, { status: 408 });
      }

      console.error("Error fetching URL:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to fetch webpage content",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Metadata API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
