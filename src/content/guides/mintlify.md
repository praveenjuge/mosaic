---
title: "Mintlify"
slug: "mintlify"
description: "Get started with integrating Mosaic into your Mintlify docs."
order: 130
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Add this to your page frontmatter

```mdx
---
title: "Your Page Title"
"og:image": "https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug&sig=SIGNATURE"
---
```
