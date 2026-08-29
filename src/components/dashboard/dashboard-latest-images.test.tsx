import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardLatestImages } from "./dashboard-latest-images";

describe("latest OG images", () => {
  test("renders a cached image thumbnail and its page link", () => {
    const markup = renderToStaticMarkup(
      <DashboardLatestImages
        latestScreenshots={[
          {
            key: "global/example.jpeg",
            page_url: "https://example.com/page",
            size_in_bytes: 12_345,
            generated_at: 1_788_000_000_000,
            url_base: "example.com",
          },
        ]}
      />,
    );

    expect(markup).toContain(
      'src="https://mosaic.example/i/global/example.jpeg"',
    );
    expect(markup).toContain('href="https://example.com/page"');
    expect(markup).toContain("OG image for https://example.com/page");
  });
});
