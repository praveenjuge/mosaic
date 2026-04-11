import { buildOrganizationJsonLd, buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

const homeDescription =
  "Instantly turn your website's hero sections into stunning OG images-no design skills needed. Boost brand visibility and drive clicks with automated, high-converting social previews.";

export const Route = createFileRoute("/_public/")({
  head: () => {
    const seo = buildSeoMeta({
      title: "Simplify Your Open Graph Image Creation.",
      description: homeDescription,
      image: getOgImageUrl(""),
      path: "/",
    });

    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildOrganizationJsonLd()),
        },
      ],
    };
  },
});
