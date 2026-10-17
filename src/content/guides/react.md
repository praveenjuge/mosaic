---
title: "React"
slug: "react"
description: "Render og:image in a React 19 component."
order: 20
svgLight: "react_light"
svgDark: "react_dark"
---

React 19 moves `<meta>` tags into `<head>`:

```jsx
function BlogPost({ post }) {
  const pageUrl = `https://yourwebsite.com/blog/${post.slug}`;

  return (
    <article>
      <meta
        property="og:image"
        content={`https://mosaic.praveenjuge.com/use?url=${encodeURIComponent(pageUrl)}`}
      />
      <h1>{post.title}</h1>
    </article>
  );
}
```

Crawlers don't run JavaScript, so this needs server rendering, as in [Next.js](/help/guides/nextjs) or [React Router](/help/guides/remix). Client-only apps should put a static tag in `index.html` ([HTML](/help/guides/html)). On React 18, use `react-helmet-async`.
