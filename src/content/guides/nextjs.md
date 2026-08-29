---
title: "Next.js"
slug: "nextjs"
description: "Get started with integrating Mosaic into your Next.js project."
order: 10
svgLight: "nextjs_icon_dark"
svgDark: "nextjs_icon_dark"
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Use the metadata export in your layout or page files

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug&sig=SIGNATURE",
        width: 1200,
        height: 630,
        alt: "Open Graph Image",
      },
    ],
  },
};
```

## For dynamic routes, use `generateMetadata`

```typescript
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = params.slug;

  return {
    title: `Post: ${slug}`,
    openGraph: {
      images: [
        {
          url: `https://mosaic.praveenjuge.com/use?url=${encodeURIComponent(`https://yourwebsite.com/${slug}`)}&sig=SIGNATURE`,
          width: 1200,
          height: 630,
          alt: `Open Graph Image for ${slug}`,
        },
      ],
    },
  };
}
```
