---
title: "Next.js"
slug: "nextjs"
description: "Get started with integrating Mosaic into your Next.js project."
order: 10
svgLight: "nextjs_icon_dark"
svgDark: "nextjs_icon_dark"
---

## Use the metadata export in your layout or page files

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "https://mosaicimg.com/use?url=yourwebsite.com/your_slug",
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
          url: `https://mosaicimg.com/use?url=yourwebsite.com/${slug}`,
          width: 1200,
          height: 630,
          alt: `Open Graph Image for ${slug}`,
        },
      ],
    },
  };
}
```
