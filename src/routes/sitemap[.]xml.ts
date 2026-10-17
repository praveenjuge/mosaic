import { publicEnv } from "@/lib/env";
import { createFileRoute } from "@tanstack/react-router";

/** Lists every public content page: the home page, help center, and legal. */
async function sitemap(): Promise<Response> {
  // Imported here so the Markdown mirror stays out of the client bundle.
  const { default: markdownPages } =
    await import("virtual:mosaic-content/markdownPages");
  const entries = Object.keys(markdownPages).map((path) => {
    const loc = new URL(path.slice(1), publicEnv.siteUrl).href;
    return `  <url><loc>${loc.replaceAll("&", "&amp;")}</loc></url>`;
  });
  // Sitemap XML from build-time content paths, not HTML from request input.
  // eslint-disable-next-line xss/no-mixed-html
  return new Response(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      "</urlset>",
      "",
    ].join("\n"),
    {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    },
  );
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: sitemap,
    },
  },
});
