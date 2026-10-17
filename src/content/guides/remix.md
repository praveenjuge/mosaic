---
title: "Remix"
slug: "remix"
description: "Set og:image from a React Router or Remix meta export."
order: 30
svgLight: "remix_light"
svgDark: "remix_dark"
---

```typescript
import type { MetaFunction } from "react-router"; // Remix v2: "@remix-run/node"

export const meta: MetaFunction = ({ location }) => [
  {
    property: "og:image",
    content: `https://mosaic.praveenjuge.com/use?url=${encodeURIComponent(`https://yourwebsite.com${location.pathname}`)}`,
  },
];
```

Only the deepest matching route's `meta` applies.
