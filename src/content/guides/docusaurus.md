---
title: "Docusaurus"
slug: "docusaurus"
description: "Get started with integrating Mosaic into your Docusaurus project."
order: 110
---

## Use the `Head` component in your pages

```jsx
import Head from "@docusaurus/Head";

export default function MyPage() {
  return (
    <>
      <Head>
        <meta
          property="og:image"
          content="https://mosaicimg.com/use?url=yourwebsite.com/your_slug"
        />
      </Head>
      <div>Your content</div>
    </>
  );
}
```
