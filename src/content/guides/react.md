---
title: "React"
slug: "react"
description: "Get started with integrating Mosaic into your React project."
order: 20
svgLight: "react_light"
svgDark: "react_dark"
---

## In React 19+, render meta tags directly

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta property="og:title" content={post.title} />
      <meta
        property="og:image"
        content={`https://mosaic.praveenjuge.com/use?url=${encodeURIComponent(`https://yourwebsite.com/${post.slug}`)}`}
      />
      <meta property="og:type" content="article" />
      <h1>{post.title}</h1>
      {/* Rest of your content */}
    </article>
  );
}
```

## For older React versions, use React Helmet

```jsx
import { Helmet } from "react-helmet-async";

export default function Page() {
  return (
    <>
      <Helmet>
        <meta
          property="og:image"
          content="https://mosaic.praveenjuge.com/use?url=https%3A%2F%2Fyourwebsite.com%2Fyour_slug"
        />
        <meta property="og:type" content="website" />
      </Helmet>
      <h1>Your Page Content</h1>
    </>
  );
}
```
