---
title: "Docusaurus"
slug: "docusaurus"
description: "Get started with integrating Mosaic into your Docusaurus project."
order: 110
---

> Replace `SIGNATURE` with the HMAC for the exact HTTPS page URL. Generate it only on your server or during the build; see [Use the Mosaic API](/help/use-the-mosaic-api).

## Use the `Head` component in your pages

```jsx
import Head from "@docusaurus/Head";

export default function MyPage() {
  return (
    <>
      <Head>
        <meta
          property="og:image"
          content="https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug&amp;sig=SIGNATURE"
        />
      </Head>
      <div>Your content</div>
    </>
  );
}
```
