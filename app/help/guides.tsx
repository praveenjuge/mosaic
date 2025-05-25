import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight } from "@mynaui/icons-react";
import Link from "next/link";

const mosaicURL = "https://mosaicimg.com/use?url=yourwebsite.com";

interface Guide {
  title: string;
  slug: string;
  svgLight?: string;
  svgDark?: string;
  steps: { title: string; code?: string; codeLang?: string }[];
}

export const guides: Guide[] = [
  {
    title: "Next.js",
    slug: "nextjs",
    svgLight: "nextjs_icon_dark",
    svgDark: "nextjs_icon_dark",
    steps: [
      {
        title:
          "You can add the OG image URL in your `layout.js` or `page.js` file.",
        code: `import { Metadata } from 'next'

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: '${mosaicURL}/your_slug',
        width: 1200,
        height: 630,
        alt: 'Open Graph Image',
      },
    ],
  },
}

export default function Page() {
  return (
    // Your page content
  )
}`,
        codeLang: "js",
      },
      {
        title:
          "You can use the `generateMetadata` function in combination with dynamic routes. Create a dynamic route in your Next.js app. For example, let's create a `[slug].tsx` file in the `app/posts` directory.",
        code:
          `export async function generateMetadata({ params, searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const slug = await (params.slug);

  return {
    title: \`Post: \${slug}\`,
    openGraph: {
      images: [
        {
          url: \`${mosaicURL}/\${slug}\`,
          width: 1200,
          height: 630,
          alt: \`Open Graph Image for \${slug}\`,
        },
      ],
    },
  }
}`,
        codeLang: "js",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com' and 'your_slug') with your actual website URL and slug.",
      },
    ],
  },
  {
    title: "React",
    slug: "react",
    svgLight: "react_light",
    svgDark: "react_dark",
    steps: [
      {
        title: "First, install React Helmet:",
        code: `npm install react-helmet`,
        codeLang: "bash",
      },
      {
        title: "Then, you can use it in your React component like this:",
        code: `import React from 'react'
import { Helmet } from 'react-helmet'

export default function Page() {
  return (
    <div>
      <Helmet>
        <meta property="og:title" content="Your Page Title" />
        <meta property="og:description" content="Your page description" />
        <meta property="og:image" content="${mosaicURL}" />
        <meta property="og:type" content="website" />
      </Helmet>
      <h1>Your Page Content</h1>
      {/* Rest of your page content */}
    </div>
  )
}`,
        codeLang: "js",
      },
      {
        title:
          `Remember to replace the placeholder values (like 'Your Page Title' and 'yourwebsite.com') with your actual page title and website URL.`,
      },
    ],
  },
  {
    title: "Remix",
    slug: "remix",
    svgLight: "remix_light",
    svgDark: "remix_dark",
    steps: [
      {
        title:
          "If you want to add OG metadata to all pages in your Remix app, you can create a root layout file (`app/root.tsx`) and define a `meta` export there:",
        code: `import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { charset: "utf-8" },
    { viewport: "width=device-width,initial-scale=1" },
    { title: "Your App Name" },
    { name: "description", content: "Your app description" },
    { property: "og:title", content: "Your App Name" },
    { property: "og:description", content: "Your app description" },
    { property: "og:image", content: "${mosaicURL}" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}`,
        codeLang: "js",
      },
      {
        title:
          "To add OG metadata to a specific route (e.g., `app/routes/your-page.tsx`), export a `meta` function that returns an array of meta objects.",
        code:
          `import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

type LoaderData = {
  title: string;
  description: string;
  imageUrl: string;
};

export const loader: LoaderFunction = async () => {
  // You can fetch data here if needed
  return {
    title: "Your Page Title",
    description: "Your page description",
    imageUrl: \`${mosaicURL}/your_slug\`,
  };
};

export const meta: MetaFunction = ({ data }) => {
  const { title, description, imageUrl } = data as LoaderData;
  return [
    { title: title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];
};

export default function YourPage() {
  const { title, description } = useLoaderData<LoaderData>();

  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {/* Rest of your page content */}
    </div>
  );
}`,
        codeLang: "js",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com' and 'your_slug') with your actual website URL and slug.",
      },
    ],
  },
  {
    title: "Astro",
    slug: "astro",
    svgLight: "astro",
    svgDark: "astro_dark",
    steps: [
      {
        title: "In your Astro page, you can add the OG image URL:",
        code: `---
const title = "Your Page Title";
const description = "Your page description";
const image = "${mosaicURL}/your_slug";
---

<p>your page content</p>
`,
        codeLang: "astro",
      },
      {
        title: "Add you can reference the image URL in your Layout file:",
        code: `---
const { image } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:image" content="\${image}" />
  </head>
</html>`,
        codeLang: "astro",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com' and 'your_slug') with your actual website URL and slug.",
      },
    ],
  },
  {
    title: "Nuxt",
    slug: "nuxt",
    steps: [
      {
        title: "In your Nuxt App, use useHead composable in your index page",
        code: `// pages/index.vue
<script setup>
useHead({
  meta: [
    {
      property: 'og:image',
      content: '${mosaicURL}/your_slug'
    },
    {
      property: 'og:title',
      content: 'Your Homepage Title'
    },
    {
      property: 'og:description',
      content: 'Your homepage description'
    }
  ]
})
</script>`,
        codeLang: "vue",
      },
      {
        title: "For dynamic pages:",
        code: `// pages/blog/[slug].vue
<script setup>
const route = useRoute()

const { data: post } = await useFetch(\`/api/posts/\${route.params.slug}\`)

useHead({
  meta: [
    {
      property: 'og:image',
      // Using dynamic OG image based on the post
      content: '${mosaicURL}/\${route.params.slug}'
    },
    {
      property: 'og:title',
      content: post.value?.title
    },
    {
      property: 'og:description',
      content: post.value?.description
    }
  ]
})
</script> `,
        codeLang: "vue",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com' and 'your_slug') with your actual website URL and slug.",
      },
    ],
  },
  {
    title: "Hugo",
    slug: "hugo",
    steps: [
      {
        title: "In your Hugo Layout file, you can add the OG image URL:",
        code: `{{- $baseURL := "<https://mosaicimg.com/use?url=>" -}}
{{- $pageURL := .Page.Permalink -}}
{{- $ogImageURL := printf "%s%s" $baseURL $pageURL -}}
<meta property="og:image" content="{{ $ogImageURL }}">
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />`,
        codeLang: "html",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com') with your actual website URL.",
      },
    ],
  },
  {
    title: "HTML",
    slug: "html",
    svgLight: "html5",
    svgDark: "html5",
    steps: [
      {
        title: "In your HTML file, you can add the OG image URL:",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Page Title</title>

    <!-- Basic SEO -->
    <meta name="description" content="Your page description">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Your Page Title">
    <meta property="og:description" content="Your page description">
    <meta property="og:image" content="${mosaicURL}/your_slug">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Your Page Title">
    <meta name="twitter:description" content="Your page description">
    <meta name="twitter:image" content="${mosaicURL}/your_slug">
</head>
<body>
    <!-- Your content here -->
</body>
</html>
`,
        codeLang: "html",
      },
      {
        title: "For pages with dynamic slugs, create a template like this: ",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog Post Title</title>

    <!-- You can use server-side code to insert the slug -->
    <!-- Example with PHP: -->
    <?php
        $slug = basename($_SERVER['REQUEST_URI']);
        $ogImage = "${mosaicURL}/\${slug}";
    ?>
    
    <meta property="og:image" content="<?php echo htmlspecialchars($ogImage); ?>">
    
    <!-- Or if using JavaScript to set it dynamically: -->
    <script>
        const slug = window.location.pathname.split('/').pop();
        const ogImage = \`${mosaicURL}/\${slug}\`;
        
        // Update OG tags
        document.querySelector('meta[property="og:image"]')
            ?.setAttribute('content', ogImage);
        document.querySelector('meta[name="twitter:image"]')
            ?.setAttribute('content', ogImage);
    </script>

    <!-- Rest of your meta tags -->
</head>
<body>
    <!-- Your content here -->
</body>
</html>`,
        codeLang: "html",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com' and 'your_slug') with your actual website URL and slug.",
      },
    ],
  },
  {
    title: "Angular",
    slug: "angular",
    steps: [
      {
        title: "In your Angular app, you can add the OG image URL:",
        code: `// app.component.ts
import { Component } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  constructor(
    private meta: Meta,
    private title: Title
  ) {
    // Set default OG tags
    this.meta.addTags([
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: '${mosaicURL}/your_slug' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' }
    ]);
  }
}`,
        codeLang: "ts",
      },
      {
        title: "For dynamic pages:",
        code: `// blog-post.component.ts
import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-blog-post',
  template: \`
    <article>
      <h1>{{ post.title }}</h1>
    </article>
  \`,
})
export class BlogPostComponent implements OnInit {
  post: any;

  constructor(
    private meta: Meta,
    private title: Title,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get the slug from the route
    const slug = this.route.snapshot.paramMap.get('slug');
    
    // Fetch post data (example)
    this.fetchPost(slug).subscribe(post => {
      this.post = post;
      this.updateMetaTags();
    });
  }

  private updateMetaTags() {
    // Update title
    this.title.setTitle(this.post.title);

    // Update OG tags
    this.meta.updateTag({ property: 'og:title', content: this.post.title });
    this.meta.updateTag({ property: 'og:description', content: this.post.description });
    
    // Dynamic OG image based on slug
    const ogImage = \`${mosaicURL}/\${this.post.slug}\`;
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });
  }

  private fetchPost(slug: string) {
    // Your post fetching logic here
    return of({ /* post data */ });
  }
}
`,
        codeLang: "ts",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com') with your actual website URL.",
      },
    ],
  },
  {
    title: "Docusaurus",
    slug: "docusaurus",
    steps: [
      {
        title: "For Blog Posts:",
        code: `---
title: My Blog Post
description: Description of my blog post
# Static image approach:
image: /img/blog/my-post-og.png
# Or dynamic slug-based approach:
slug: /blog/my-post
---

// src/theme/BlogPostPage.js
import React from 'react';
import BlogPostPage from '@theme-original/BlogPostPage';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function BlogPostPageWrapper(props) {
  const {siteConfig} = useDocusaurusContext();
  const {
    metadata: {frontMatter, slug, title, description},
  } = props.content;

  // Generate OG image URL based on slug
  const ogImage = frontMatter.image
    ? useBaseUrl(frontMatter.image, {absolute: true})
    : \`${mosaicURL}/\${slug.replace(/^/blog/, '')}\`;

  return (
    <>
      <Head>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      <BlogPostPage {...props} />
    </>
  );
}`,
        codeLang: "js",
      },
      {
        title: "For Documentation Pages:",
        code: `// src/theme/DocItem.js
import React from 'react';
import DocItem from '@theme-original/DocItem';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function DocItemWrapper(props) {
  const {siteConfig} = useDocusaurusContext();
  const {
    metadata: {frontMatter, id, title, description},
  } = props.content;

  // Generate OG image URL based on doc ID
  const ogImage = frontMatter.image
    ? useBaseUrl(frontMatter.image, {absolute: true})
    : \`${mosaicURL}/\${id}\`;

  return (
    <>
      <Head>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      <DocItem {...props} />
    </>
  );
}`,
        codeLang: "js",
      },
      {
        title: "For custom pages, create a component like this:",
        code: `// src/pages/custom-page.js
import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function CustomPage() {
  const {siteConfig} = useDocusaurusContext();
  const pageTitle = 'Custom Page Title';
  
  return (
    <Layout title={pageTitle}>
      <Head>
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content="Custom page description" />
        <meta 
          property="og:image" 
          content="${mosaicURL}/your_slug" 
        />
      </Head>
      {/* Your page content */}
    </Layout>
  );
}`,
        codeLang: "js",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com') with your actual website URL.",
      },
    ],
  },
  {
    title: "Dub",
    slug: "dub",
    svgLight: "dub",
    svgDark: "dub_dark_logo",
    steps: [
      {
        title:
          "While creating a New Link in dub.co, Click on the Edit Icon next to 'Link Preview'",
      },
      {
        title:
          "In the Edit Link Preview window, click on the Link Icon next to Image Box",
      },
      {
        title: `In the 'Use image from URL' modal, add ${mosaicURL}/your_slug`,
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com' and 'your_slug') with your actual website URL and slug.",
      },
    ],
  },
  {
    title: "Mintlify",
    slug: "mintlify",
    steps: [
      {
        title:
          "In your Mintlify project, add the following to the frontmatter of your page:",
        code: `// pages/introduction.mdx
---
title: 'Introduction'
description: 'Learn how to use our platform'
'og:image': '${mosaicURL}/your_slug'
---`,
        codeLang: "mdx",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com' and 'your_slug') with your actual website URL and slug.",
      },
    ],
  },
  {
    title: "SvelteKit",
    slug: "svelte",
    steps: [
      {
        title: "For static pages (e.g., src/routes/+page.svelte)",
        code: `<script lang="ts">
</script>

<svelte:head>
  <title>Your Site Name</title>
  <meta property="og:title" content="Your Site Name" />
  <meta property="og:description" content="Your site description" />
  <meta property="og:image" content="${mosaicURL}/your_slug" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<!-- Your page content -->`,
        codeLang: "svelte",
      },
      {
        title: "For dynamic pages (e.g., src/routes/blog/[slug]/+page.svelte)",
        code: `<script lang="ts">
  export let data; // your page data from +page.server.ts
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta property="og:title" content={data.title} />
  <meta property="og:description" content={data.description} />
  <meta property="og:image" content={\`${mosaicURL}/\${data.slug}\`} />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<!-- Your page content -->
`,
        codeLang: "svelte",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com' and 'your_slug') with your actual website URL and slug.",
      },
    ],
  },
  {
    title: "WordPress",
    slug: "wordpress",
    steps: [
      {
        title:
          `Open your WordPress theme’s functions.php file (Appearance > Theme Editor > Theme Functions – functions.php).`,
        code: `function add_dynamic_og_image() {
    // Get the current post slug
    global $post;
    $current_slug = $post->post_name;

    // Construct the dynamic OG image URL
    $og_image_url = '${mosaicURL}/' . $current_slug;

    // Output the OG image meta tag
    echo '<meta property="og:image" content="' . esc_url($og_image_url) . '" />';
}
add_action('wp_head', 'add_dynamic_og_image');`,
        codeLang: "php",
      },
      {
        title:
          "Remember to replace the placeholder value (like 'yourwebsite.com') with your actual website URL.",
      },
    ],
  },
];

export function GuideLink({ guide }: { guide: Guide }) {
  return (
    <Link
      target="_blank"
      rel="noopener noreferrer"
      href={`/help/guides/${guide.slug}`}
      className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={`${guide.title} icon`}
        className={cn(
          "shrink-0 select-none dark:hidden not-dark:block",
          guide.slug === "hugo" ? "size-12" : "size-4",
        )}
        src={guide.svgLight
          ? `https://svgl.app/library/${guide.svgLight}.svg`
          : `https://svgl.app/library/${guide.slug}.svg`}
      />
      <img
        alt={`${guide.title} icon`}
        className={cn(
          "shrink-0 select-none dark:block not-dark:hidden",
          guide.slug === "hugo" ? "size-12" : "size-4",
        )}
        src={guide.svgDark
          ? `https://svgl.app/library/${guide.svgDark}.svg`
          : `https://svgl.app/library/${guide.slug}.svg`}
      />
      {guide.title}
      <ChevronRight className="size-4 stroke-2 text-muted-foreground" />
    </Link>
  );
}

export default function Guides() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Framework Guides</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {guides.map((guide) => <GuideLink key={guide.slug} guide={guide} />)}
      </CardContent>
    </Card>
  );
}
