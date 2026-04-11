const mosaicUrl = "https://mosaicimg.com/use?url=yourwebsite.com";

export interface HelpGuideStep {
  title: string;
  code?: string;
  codeLang?: string;
}

export interface HelpGuide {
  title: string;
  slug: string;
  svgLight?: string;
  svgDark?: string;
  steps: HelpGuideStep[];
}

export const guides: HelpGuide[] = [
  {
    title: "Next.js",
    slug: "nextjs",
    svgLight: "nextjs_icon_dark",
    svgDark: "nextjs_icon_dark",
    steps: [
      {
        title: "Use the metadata export in your layout or page files:",
        code: `import { Metadata } from 'next'

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: '${mosaicUrl}/your_slug',
        width: 1200,
        height: 630,
        alt: 'Open Graph Image',
      },
    ],
  },
}`,
        codeLang: "typescript",
      },
      {
        title: "For dynamic routes, use generateMetadata:",
        code: `export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug

  return {
    title: \`Post: \${slug}\`,
    openGraph: {
      images: [
        {
          url: \`${mosaicUrl}/\${slug}\`,
          width: 1200,
          height: 630,
          alt: \`Open Graph Image for \${slug}\`,
        },
      ],
    },
  }
}`,
        codeLang: "typescript",
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
        title: "In React 19+, you can render meta tags directly:",
        code: `function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta property="og:title" content={post.title} />
      <meta property="og:image" content={\`${mosaicUrl}/\${post.slug}\`} />
      <meta property="og:type" content="article" />
      <h1>{post.title}</h1>
      {/* Rest of your content */}
    </article>
  )
}`,
        codeLang: "jsx",
      },
      {
        title: "For older React versions, use React Helmet:",
        code: `import { Helmet } from 'react-helmet-async'

export default function Page() {
  return (
    <>
      <Helmet>
        <meta property="og:image" content="${mosaicUrl}/your_slug" />
        <meta property="og:type" content="website" />
      </Helmet>
      <h1>Your Page Content</h1>
    </>
  )
}`,
        codeLang: "jsx",
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
        title: "Use the meta export in your route:",
        code: `import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { property: "og:image", content: "${mosaicUrl}/your_slug" },
    { property: "og:type", content: "website" },
  ];
};`,
        codeLang: "typescript",
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
        title: "Define variables in frontmatter and use in head:",
        code: `---
const title = "Your Page Title";
const ogImage = "${mosaicUrl}/your_slug";
---

<html lang="en">
  <head>
    <title>{title}</title>
    <meta property="og:title" content={title} />
    <meta property="og:image" content={ogImage} />
  </head>
  <body>
    <h1>{title}</h1>
  </body>
</html>`,
        codeLang: "astro",
      },
    ],
  },
  {
    title: "Nuxt",
    slug: "nuxt",
    steps: [
      {
        title: "Use useSeoMeta composable:",
        code: `<script setup>
useSeoMeta({
  title: 'My Page Title',
  ogTitle: 'My Page Title',
  ogImage: '${mosaicUrl}/your_slug',
  ogType: 'website'
})
</script>`,
        codeLang: "vue",
      },
      {
        title: "For dynamic pages:",
        code: `<script setup>
const route = useRoute()
const slug = route.params.slug

useSeoMeta({
  title: \`Post: \${slug}\`,
  ogTitle: \`Post: \${slug}\`,
  ogImage: \`${mosaicUrl}/\${slug}\`,
  ogType: 'article'
})
</script>`,
        codeLang: "vue",
      },
    ],
  },
  {
    title: "Hugo",
    slug: "hugo",
    steps: [
      {
        title: "Add to your layout template:",
        code: `{{ $baseURL := "https://mosaicimg.com/use?url=" }}
{{ $pageURL := .Page.Permalink }}
{{ $ogImageURL := printf "%s%s" $baseURL $pageURL }}
<meta property="og:image" content="{{ $ogImageURL }}">`,
        codeLang: "html",
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
        title: "Add meta tags in the head section:",
        code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta property="og:title" content="Your Page Title">
    <meta property="og:image" content="${mosaicUrl}/your_slug">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${mosaicUrl}/your_slug">
</head>
<body>
    <!-- Your content here -->
</body>
</html>`,
        codeLang: "html",
      },
    ],
  },
  {
    title: "Angular",
    slug: "angular",
    steps: [
      {
        title: "Use Angular's Meta service:",
        code: `import { Component } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-page',
  template: '<h1>My Page</h1>'
})
export class PageComponent {
  constructor(private meta: Meta) {
    this.meta.updateTag({ 
      property: 'og:image', 
      content: '${mosaicUrl}/your_slug' 
    });
  }
}`,
        codeLang: "typescript",
      },
    ],
  },
  {
    title: "SvelteKit",
    slug: "svelte",
    steps: [
      {
        title: "Use svelte:head for meta tags:",
        code: `<svelte:head>
  <title>Your Page Title</title>
  <meta property="og:image" content="${mosaicUrl}/your_slug" />
  <meta property="og:type" content="website" />
</svelte:head>

<!-- Your page content -->`,
        codeLang: "svelte",
      },
    ],
  },
  {
    title: "WordPress",
    slug: "wordpress",
    steps: [
      {
        title: "Add to your theme's functions.php:",
        code: `function add_dynamic_og_image() {
    global $post;
    $current_slug = $post->post_name;
    $og_image_url = '${mosaicUrl}/' . $current_slug;
    
    echo '<meta property="og:image" content="' . esc_url($og_image_url) . '" />';
}
add_action('wp_head', 'add_dynamic_og_image');`,
        codeLang: "php",
      },
    ],
  },
  {
    title: "Docusaurus",
    slug: "docusaurus",
    steps: [
      {
        title: "Use Head component in your pages:",
        code: `import Head from '@docusaurus/Head';

export default function MyPage() {
  return (
    <>
      <Head>
        <meta property="og:image" content="${mosaicUrl}/your_slug" />
      </Head>
      <div>Your content</div>
    </>
  );
}`,
        codeLang: "jsx",
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
          "When creating a link, click 'Edit' next to Link Preview, then use the image URL option to add:",
        code: `${mosaicUrl}/your_slug`,
        codeLang: "text",
      },
    ],
  },
  {
    title: "Mintlify",
    slug: "mintlify",
    steps: [
      {
        title: "Add to your page frontmatter:",
        code: `---
title: 'Your Page Title'
'og:image': '${mosaicUrl}/your_slug'
---`,
        codeLang: "mdx",
      },
    ],
  },
];
