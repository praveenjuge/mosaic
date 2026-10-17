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
import type {
  Guide,
  GuideLink,
  HelpArticle,
  HelpCategory,
  LegalDocument,
} from "./content-types";
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

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeShiki, { theme: "github-dark", langs: [], lazy: true })
  .use(rehypeLinksAndImages)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<string> {
  return String(await processor.process(markdown));
}

// ── Loading ─────────────────────────────────────────────────────────

type Frontmatter = Record<string, unknown>;

export function parseFrontmatter(raw: string): {
  data: Frontmatter;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  return { data: (parseYaml(match[1]) as Frontmatter) ?? {}, body: match[2] };
}

function requireString(data: Frontmatter, key: string, file: string): string {
  const value = data[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${file}: frontmatter "${key}" must be a non-empty string`);
  }
  return value;
}

function optionalString(data: Frontmatter, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function requireNumber(data: Frontmatter, key: string, file: string): number {
  const value = data[key];
  if (typeof value !== "number") {
    throw new Error(`${file}: frontmatter "${key}" must be a number`);
  }
  return value;
}

function requireDate(data: Frontmatter, key: string, file: string): string {
  const date = new Date(requireString(data, key, file));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${file}: frontmatter "${key}" is not a valid date`);
  }
  return date.toISOString();
}

type Entry = {
  file: string;
  slug: string;
  data: Frontmatter;
  body: string;
  contentHtml: string;
};

async function loadDirectory(directory: string): Promise<Entry[]> {
  const names = (await readdir(directory)).filter((name) =>
    name.endsWith(".md"),
  );
  return Promise.all(
    names.sort().map(async (name) => {
      const file = path.join(directory, name);
      const { data, body } = parseFrontmatter(await readFile(file, "utf8"));
      return {
        file,
        slug: optionalString(data, "slug") ?? name.replace(/\.md$/, ""),
        data,
        body,
        contentHtml: await renderMarkdown(body),
      };
    }),
  );
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

export async function loadContent(contentDir: string): Promise<Content> {
  const [helpEntries, guideEntries, legalEntries, llmsTxt] = await Promise.all([
    loadDirectory(path.join(contentDir, "help")),
    loadDirectory(path.join(contentDir, "guides")),
    loadDirectory(path.join(contentDir, "legal")),
    readFile(path.join(contentDir, "llms.txt"), "utf8"),
  ]);

  const helpArticles = helpEntries
    .map(({ file, slug, data, contentHtml }) => ({
      slug,
      title: requireString(data, "title", file),
      description: optionalString(data, "description") ?? "",
      category: optionalString(data, "category") ?? "General",
      publishedAt: requireDate(data, "publishedAt", file),
      contentHtml,
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const guides = guideEntries
    .map(({ file, slug, data, contentHtml }) => ({
      slug,
      title: requireString(data, "title", file),
      description: requireString(data, "description", file),
      order: requireNumber(data, "order", file),
      svgLight: optionalString(data, "svgLight"),
      svgDark: optionalString(data, "svgDark"),
      contentHtml,
    }))
    .sort((a, b) => a.order - b.order);

  const legalDocuments = legalEntries
    .map(({ file, slug, data, contentHtml }) => ({
      slug,
      title: requireString(data, "title", file),
      description: requireString(data, "description", file),
      updatedAt: requireDate(data, "updatedAt", file),
      order: requireNumber(data, "order", file),
      contentHtml,
    }))
    .sort((a, b) => a.order - b.order);

  const helpCategories: HelpCategory[] = [];
  for (const { category, slug, title } of helpArticles) {
    let group = helpCategories.find((entry) => entry.category === category);
    if (!group) {
      group = { category, entries: [] };
      helpCategories.push(group);
    }
    group.entries.push({ slug, title });
  }

  const byOrder = (entry: Entry) =>
    requireNumber(entry.data, "order", entry.file);
  const toMarkdown = (entry: Entry) =>
    toMarkdownDocument(
      requireString(entry.data, "title", entry.file),
      entry.body,
    );
  const markdownPages: Record<string, string> = {
    // The homepage has no Markdown body, so agents get the llms.txt site map.
    "/": `${llmsTxt.trim()}\n`,
    "/legal": [...legalEntries]
      .sort((a, b) => byOrder(a) - byOrder(b))
      .map(toMarkdown)
      .join("\n---\n\n"),
  };
  markdownPages["/help"] = [
    "# Help\n",
    ...helpCategories.map(
      ({ category, entries }) =>
        `## ${category}\n\n${entries.map(({ slug, title }) => `- [${title}](/help/${slug})`).join("\n")}\n`,
    ),
    `## Guides\n\n${guides.map(({ slug, title }) => `- [${title}](/help/guides/${slug})`).join("\n")}\n`,
  ].join("\n");
  for (const entry of helpEntries) {
    markdownPages[`/help/${entry.slug}`] = toMarkdown(entry);
  }
  for (const entry of guideEntries) {
    markdownPages[`/help/guides/${entry.slug}`] = toMarkdown(entry);
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
    legalDocuments,
    markdownPages,
  };
}

// ── Plugin ──────────────────────────────────────────────────────────

export function mosaicContent(
  contentDir = path.resolve("src/content"),
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
      this.addWatchFile(contentDir);
      content ??= loadContent(contentDir);
      const value = (await content)[key];
      if (value === undefined) this.error(`Unknown content module: ${key}`);
      return `export default ${JSON.stringify(value)};`;
    },
    configureServer(server) {
      const reload = (file: string) => {
        if (!file.startsWith(contentDir)) return;
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
      server.watcher.add(contentDir);
      server.watcher.on("add", reload);
      server.watcher.on("change", reload);
      server.watcher.on("unlink", reload);
    },
  };
}
