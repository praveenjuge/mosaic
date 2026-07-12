---
title: "Remix"
slug: "remix"
description: "Get started with integrating Mosaic into your Remix project."
order: 30
svgLight: "remix_light"
svgDark: "remix_dark"
---

## Use the `meta` export in your route

```typescript
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    {
      property: "og:image",
      content:
        "https://mosaic.praveenjuge.com/use?url=yourwebsite.com/your_slug",
    },
    { property: "og:type", content: "website" },
  ];
};
```
