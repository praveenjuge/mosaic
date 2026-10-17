---
title: "Next.js"
slug: "nextjs"
description: "Set og:image with the App Router Metadata API."
order: 10
svgLight: "nextjs_icon_dark"
svgDark: "nextjs_icon_dark"
---

In a `layout.tsx` or `page.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    images:
      "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug",
  },
};
```

For dynamic routes, use `generateMetadata`:

```typescript
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pageUrl = `https://yourwebsite.com/blog/${slug}`;

  return {
    openGraph: {
      images: `https://mosaic.praveenjuge.com/use?url=${encodeURIComponent(pageUrl)}`,
    },
  };
}
```

A page's `openGraph` replaces its layout's rather than merging with it.
