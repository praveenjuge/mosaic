---
title: "Angular"
slug: "angular"
description: "Use Angular's Meta service."
order: 80
---

```typescript
import { Component, inject } from "@angular/core";
import { Meta } from "@angular/platform-browser";

@Component({ selector: "app-page", template: "<h1>My page</h1>" })
export class PageComponent {
  constructor() {
    inject(Meta).updateTag({
      property: "og:image",
      content:
        "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug",
    });
  }
}
```

Crawlers don't run JavaScript, so enable SSR (`ng add @angular/ssr`).
