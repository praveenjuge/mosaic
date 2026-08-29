---
title: "Angular"
slug: "angular"
description: "Get started with integrating Mosaic into your Angular project."
order: 80
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Use Angular's `Meta` service

```typescript
import { Component } from "@angular/core";
import { Meta } from "@angular/platform-browser";

@Component({
  selector: "app-page",
  template: "<h1>My Page</h1>",
})
export class PageComponent {
  constructor(private meta: Meta) {
    this.meta.updateTag({
      property: "og:image",
      content:
        "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug&sig=SIGNATURE",
    });
  }
}
```
