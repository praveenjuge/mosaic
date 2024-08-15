import { website_url } from "@/lib/constants";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${website_url}sitemap.xml`,
    host: website_url,
  };
}
