import { describe, expect, test } from "bun:test";
import { extractMetadata } from "./metadata";

const baseUrl = new URL("https://example.com/blog/post");

function extract(html: string) {
  return extractMetadata(new Response(html), baseUrl);
}

describe("extractMetadata", () => {
  test("prefers Open Graph tags and resolves relative images", async () => {
    const metadata = await extract(`
      <head>
        <title>Fallback</title>
        <meta property="og:title" content="OG   title">
        <meta name="description" content="Plain description">
        <meta property="og:image" content="/cover.png">
      </head>`);
    expect(metadata).toEqual({
      title: "OG title",
      description: "Plain description",
      image: "https://example.com/cover.png",
    });
  });

  test("reads content before property and keeps apostrophes", async () => {
    const metadata = await extract(
      `<meta content="Let's go" property="og:title">`,
    );
    expect(metadata.title).toBe("Let's go");
  });

  test("falls back to the first title element only", async () => {
    const metadata = await extract(
      `<title> Page
        title </title><body><svg><title>Icon</title></svg></body>`,
    );
    expect(metadata).toEqual({
      title: "Page title",
      description: "",
      image: "",
    });
  });

  test("uses Twitter Card tags when Open Graph is missing", async () => {
    const metadata = await extract(`
      <meta name="twitter:title" content="Tweet title">
      <meta name="twitter:description" content="Tweet description">
      <meta name="twitter:image:src" content="https://cdn.example.com/i.png">`);
    expect(metadata).toEqual({
      title: "Tweet title",
      description: "Tweet description",
      image: "https://cdn.example.com/i.png",
    });
  });

  test("stops reading the page at <body>", async () => {
    const encoder = new TextEncoder();
    // A body that never ends: extraction must not wait for it.
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `<head><meta property="og:title" content="Head title"></head><body>`,
          ),
        );
      },
    });
    const metadata = await extractMetadata(new Response(body), baseUrl);
    expect(metadata.title).toBe("Head title");
  });
});
