import { publicEnv } from "@/lib/env";
import { createFileRoute } from "@tanstack/react-router";

/** Lists every public content page: the home page, help center, and legal. */
async function sitemap(): Promise<Response> {
  // Imported here so the Markdown mirror stays out of the client bundle.
  const { default: markdownPages } =
    await import("virtual:mosaic-content/markdownPages");
  const urls = Object.keys(markdownPages).map(
    (path) =>
      `  <url><loc>${new URL(path.slice(1), publicEnv.siteUrl)}</loc></url>`,
  );
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: sitemap,
    },
  },
});
