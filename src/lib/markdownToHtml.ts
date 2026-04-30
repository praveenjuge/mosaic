import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { unified } from "unified";

// ── Shiki highlighter (JS regex engine for Cloudflare compatibility) ─

const highlighter = await createHighlighterCore({
  themes: [import("shiki/themes/github-dark.mjs")],
  langs: [
    import("shiki/langs/astro.mjs"),
    import("shiki/langs/bash.mjs"),
    import("shiki/langs/docker.mjs"),
    import("shiki/langs/html.mjs"),
    import("shiki/langs/jsx.mjs"),
    import("shiki/langs/mdx.mjs"),
    import("shiki/langs/php.mjs"),
    import("shiki/langs/python.mjs"),
    import("shiki/langs/svelte.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/vue.mjs"),
    import("shiki/langs/yaml.mjs"),
  ],
  engine: createJavaScriptRegexEngine(),
});

// ── Custom rehype plugins ───────────────────────────────────────────

/**
 * Simple tree visitor for hast nodes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HastNode = any;

function visit(
  tree: HastNode,
  type: string,
  visitor: (node: HastNode, index?: number, parent?: HastNode) => void,
) {
  function walk(node: HastNode, index?: number, parent?: HastNode) {
    if (node.type === type) {
      visitor(node, index, parent);
    }
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        walk(node.children[i], i, node);
      }
    }
  }
  walk(tree);
}

/**
 * Rehype plugin: add target="_blank" and rel="noopener noreferrer" to all links.
 */
function rehypeExternalLinks() {
  return (tree: HastNode) => {
    visit(tree, "element", (node: HastNode) => {
      if (node.tagName === "a") {
        node.properties = node.properties || {};
        node.properties.target = "_blank";
        node.properties.rel = "noopener noreferrer";
      }
    });
  };
}

/**
 * Rehype plugin: wrap images in links and add loading="lazy".
 */
function rehypeLazyImages() {
  return (tree: HastNode) => {
    visit(
      tree,
      "element",
      (node: HastNode, index: number | undefined, parent: HastNode) => {
        if (node.tagName === "img" && parent && index !== undefined) {
          const src = node.properties?.src ?? "";
          node.properties = node.properties || {};
          node.properties.loading = "lazy";

          const wrapper = {
            type: "element",
            tagName: "a",
            properties: {
              target: "_blank",
              rel: "noreferrer noopener",
              href: src,
            },
            children: [node],
          };

          parent.children[index] = wrapper;
        }
      },
    );
  };
}

// ── Processor ───────────────────────────────────────────────────────

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .use(rehypeShikiFromHighlighter, highlighter as any, {
    themes: { light: "github-dark" },
  })
  .use(rehypeExternalLinks)
  .use(rehypeLazyImages)
  .use(rehypeStringify);

export default async function markdownToHtml(
  markdown: string,
): Promise<string> {
  const result = await processor.process(markdown);
  return String(result);
}
