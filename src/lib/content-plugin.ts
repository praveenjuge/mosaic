/**
 * Vite plugin that turns `src/content` into the `virtual:mosaic-content`
 * module at build time. Markdown is parsed, highlighted and rendered here, in
 * Node, so neither the Worker nor the browser bundles unified or Shiki.
 *
 * Each collection is its own module (`virtual:mosaic-content/guideLinks`, …),
 * so a page that only needs guide links does not pull in every article's HTML.
 */

import rehypeShiki from "@shikijs/rehype";
import type { Element, Root } from "hast";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type {
  Guide,
  GuideLink,
  HelpArticle,
  HelpCategory,
  LegalDocument,
} from "./content-types";
import { readImageSize } from "./image-size";
import { toMarkdownDocument } from "./markdown-negotiation";

const VIRTUAL_PREFIX = "virtual:mosaic-content/";

// ── Markdown rendering ──────────────────────────────────────────────

/** External links open in a new tab; images load lazily and link to themselves. */
function rehypeLinksAndImages() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName === "a" &&
        /^https?:/.test(String(node.properties.href))
      ) {
        node.properties.target = "_blank";
        node.properties.rel = ["noopener", "noreferrer"];
      }

      if (node.tagName === "img" && parent && index !== undefined) {
        node.properties.loading = "lazy";
        if (parent.type === "element" && parent.tagName === "a") return;

        const link: Element = {
          type: "element",
          tagName: "a",
          properties: {
            href: node.properties.src,
            target: "_blank",
            rel: ["noopener", "noreferrer"],
          },
          children: [node],
        };
        parent.children[index] = link;
        return SKIP;
      }
    });
  };
}

/**
 * Images from `public/` get their `width` and `height`, so the page doesn't
 * shift when they load. Others are left as they are.
 */
function rehypeImageSizes() {
  const publicDir = path.resolve("public");
  return async (tree: Root) => {
    const images: Element[] = [];
    visit(tree, "element", (node) => {
      const src = String(node.properties.src ?? "");
      if (node.tagName === "img" && /^\/(?!\/)/.test(src)) images.push(node);
    });
    await Promise.all(
      images.map(async (node) => {
        const file = path.join(publicDir, String(node.properties.src));
        if (!file.startsWith(publicDir + path.sep)) return;
        const size = await readFile(file).then(readImageSize, () => null);
        if (!size) return;
        node.properties.width = size.width;
        node.properties.height = size.height;
      }),
    );
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeShiki, { theme: "github-dark", langs: [], lazy: true })
  .use(rehypeLinksAndImages)
  .use(rehypeImageSizes)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<string> {
  return String(await processor.process(markdown));
}

// ── Loading ─────────────────────────────────────────────────────────

export function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  return { data: parseYaml(match[1]) ?? {}, body: match[2] };
}

const isoDate = z.coerce.date().transform((date) => date.toISOString());

const helpSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  category: z.string().default("General"),
  publishedAt: isoDate,
});

const guideSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number(),
  svgLight: z.string().optional(),
  svgDark: z.string().optional(),
});

const legalSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  updatedAt: isoDate,
  order: z.number(),
});

/** Parse every Markdown file in a directory, sorted by file name. */
async function loadCollection<T extends { title: string }>(
  directory: string,
  schema: z.ZodType<T>,
) {
  const names = (await readdir(directory))
    .filter((name) => name.endsWith(".md"))
    .sort();

  return Promise.all(
    names.map(async (name) => {
      const file = path.join(directory, name);
      const { data, body } = parseFrontmatter(await readFile(file, "utf8"));
      const result = schema.safeParse(data);
      if (!result.success) {
        throw new Error(
          `${file}: invalid frontmatter: ${result.error.message}`,
        );
      }

      const slug =
        typeof data.slug === "string" ? data.slug : name.slice(0, -3);
      return {
        entry: {
          slug,
          ...result.data,
          contentHtml: await renderMarkdown(body),
        },
        markdown: toMarkdownDocument(result.data.title, body),
      };
    }),
  );
}

function linkList(heading: string, links: Array<[string, string]>): string {
  const items = links.map(([title, href]) => `- [${title}](${href})`);
  return `## ${heading}\n\n${items.join("\n")}\n`;
}

export type Content = {
  helpArticles: HelpArticle[];
  helpCategories: HelpCategory[];
  guides: Guide[];
  guideLinks: GuideLink[];
  legalDocuments: LegalDocument[];
  /** Markdown mirror of each content page, keyed by pathname. */
  markdownPages: Record<string, string>;
};

export async function loadContent(
  contentDir: string,
  llmsTxtPath: string,
): Promise<Content> {
  const [help, guideFiles, legal, llmsTxt] = await Promise.all([
    loadCollection(path.join(contentDir, "help"), helpSchema),
    loadCollection(path.join(contentDir, "guides"), guideSchema),
    loadCollection(path.join(contentDir, "legal"), legalSchema),
    readFile(llmsTxtPath, "utf8"),
  ]);
  help.sort((a, b) => b.entry.publishedAt.localeCompare(a.entry.publishedAt));
  guideFiles.sort((a, b) => a.entry.order - b.entry.order);
  legal.sort((a, b) => a.entry.order - b.entry.order);

  const helpArticles = help.map(({ entry }) => entry);
  const guides = guideFiles.map(({ entry }) => entry);

  const helpCategories: HelpCategory[] = [];
  for (const { category, slug, title } of helpArticles) {
    let group = helpCategories.find((entry) => entry.category === category);
    if (!group) {
      group = { category, entries: [] };
      helpCategories.push(group);
    }
    group.entries.push({ slug, title });
  }

  const markdownPages: Record<string, string> = {
    // The homepage has no Markdown body, so agents get the llms.txt site map.
    "/": `${llmsTxt.trim()}\n`,
    "/help": [
      "# Help\n",
      ...helpCategories.map(({ category, entries }) =>
        linkList(
          category,
          entries.map(({ slug, title }) => [title, `/help/${slug}`]),
        ),
      ),
      linkList(
        "Guides",
        guides.map(({ slug, title }) => [title, `/help/guides/${slug}`]),
      ),
    ].join("\n"),
    "/legal": legal.map(({ markdown }) => markdown).join("\n---\n\n"),
  };
  for (const { entry, markdown } of help) {
    markdownPages[`/help/${entry.slug}`] = markdown;
  }
  for (const { entry, markdown } of guideFiles) {
    markdownPages[`/help/guides/${entry.slug}`] = markdown;
  }

  return {
    helpArticles,
    helpCategories,
    guides,
    guideLinks: guides.map(
      ({ slug, title, description, svgLight, svgDark }) => ({
        slug,
        title,
        description,
        svgLight,
        svgDark,
      }),
    ),
    legalDocuments: legal.map(({ entry }) => entry),
    markdownPages,
  };
}

// ── Plugin ──────────────────────────────────────────────────────────

export function mosaicContent(
  contentDir = path.resolve("src/content"),
  // Served as a static file too; the home page's Markdown mirror reuses it.
  llmsTxtPath = path.resolve("public/llms.txt"),
): Plugin {
  let content: Promise<Content> | undefined;

  return {
    name: "mosaic:content",
    resolveId(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return;
      return { id: `\0${id}`, moduleSideEffects: false };
    },
    async load(id) {
      if (!id.startsWith(`\0${VIRTUAL_PREFIX}`)) return;
      const key = id.slice(VIRTUAL_PREFIX.length + 1) as keyof Content;
      content ??= loadContent(contentDir, llmsTxtPath);
      const value = (await content)[key];
      if (value === undefined) this.error(`Unknown content module: ${key}`);
      return `export default ${JSON.stringify(value)};`;
    },
    configureServer(server) {
      const reload = (file: string) => {
        if (!file.startsWith(contentDir) && file !== llmsTxtPath) return;
        content = undefined;
        for (const environment of Object.values(server.environments)) {
          const graph = environment.moduleGraph;
          for (const [id, module] of graph.idToModuleMap) {
            if (id.startsWith(`\0${VIRTUAL_PREFIX}`))
              graph.invalidateModule(module);
          }
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.add([contentDir, llmsTxtPath]);
      server.watcher.on("add", reload);
      server.watcher.on("change", reload);
      server.watcher.on("unlink", reload);
    },
  };
}
