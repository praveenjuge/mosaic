---
title: "Remix"
slug: "remix"
description: "Get started with integrating Mosaic into your Remix project."
order: 30
svgLight: "remix_light"
svgDark: "remix_dark"
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Use the `meta` export in your route

```typescript
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    {
      property: "og:image",
      content:
        "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug&sig=SIGNATURE",
    },
    { property: "og:type", content: "website" },
  ];
};
```
