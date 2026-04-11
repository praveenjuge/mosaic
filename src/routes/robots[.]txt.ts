import { publicEnv } from "@/lib/env";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          `User-agent: *\nAllow: /\nSitemap: ${publicEnv.siteUrl}sitemap.xml\nHost: ${publicEnv.siteUrl}\n`,
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          },
        ),
    },
  },
});
