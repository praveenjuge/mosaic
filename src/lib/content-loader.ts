/**
 * Build-time content loader using Vite's import.meta.glob.
 *
 * Replaces @content-collections/core by loading markdown files directly,
 * parsing frontmatter with a lightweight parser (no Node.js Buffer dependency),
 * and rendering HTML with markdownToHtml.
 *
 * Uses top-level await since the unified markdown pipeline is async.
 */

import markdownToHtml from "./markdownToHtml";

// ── Raw markdown imports (resolved at build time by Vite) ───────────

const helpRaw = import.meta.glob("../content/help/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const changelogRaw = import.meta.glob("../content/changelog/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const guidesRaw = import.meta.glob("../content/guides/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const legalRaw = import.meta.glob("../content/legal/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

// ── Lightweight frontmatter parser ──────────────────────────────────

/**
 * Parse YAML-style frontmatter from a markdown string.
 * Handles strings (quoted and unquoted), numbers, and optional fields.
 * No external dependencies — no Buffer needed.
 */
function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const [, yamlBlock, content] = match;
  const data: Record<string, unknown> = {};

  for (const line of yamlBlock.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value: unknown = trimmed.slice(colonIndex + 1).trim();

    // Remove surrounding quotes
    if (
      typeof value === "string" &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = (value as string).slice(1, -1);
    }

    // Parse numbers
    if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
      value = Number(value);
    }

    if (value === "") {
      value = undefined;
    }

    data[key] = value;
  }

  return { data, content };
}

// ── Helpers ─────────────────────────────────────────────────────────

function slugFromPath(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? "";
  return fileName.replace(/\.md$/, "");
}

function toIsoDate(value: string, field: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} date: ${value}`);
  }
  return date.toISOString();
}

// ── Types ───────────────────────────────────────────────────────────

export interface HelpArticle {
  title: string;
  description: string;
  category?: string;
  publishedAt: string;
  slug: string;
  content: string;
  contentHtml: string;
}

export interface ChangelogEntry {
  title: string;
  publishedAt: string;
  slug: string;
  content: string;
  contentHtml: string;
}

export interface Guide {
  title: string;
  slug: string;
  description: string;
  order: number;
  svgLight?: string;
  svgDark?: string;
  content: string;
  contentHtml: string;
}

export interface LegalDocument {
  title: string;
  slug: string;
  description: string;
  updatedAt: string;
  order: number;
  content: string;
  contentHtml: string;
}

// ── Loaders ─────────────────────────────────────────────────────────

async function loadCollection<T>(
  rawFiles: Record<string, string>,
  transform: (
    slug: string,
    frontmatter: Record<string, unknown>,
    content: string,
    html: string,
  ) => T,
): Promise<T[]> {
  return Promise.all(
    Object.entries(rawFiles).map(async ([filePath, raw]) => {
      const { data, content } = parseFrontmatter(raw);
      const slug = slugFromPath(filePath);
      const html = await markdownToHtml(content);
      return transform(slug, data, content, html);
    }),
  );
}

export const allHelpArticles: HelpArticle[] = await loadCollection(
  helpRaw,
  (slug, fm, content, html) => ({
    title: fm.title as string,
    description: (fm.description as string) ?? "",
    category: fm.category as string | undefined,
    publishedAt: toIsoDate(fm.publishedAt as string, "publishedAt"),
    slug,
    content,
    contentHtml: html,
  }),
);

export const allChangelogEntries: ChangelogEntry[] = await loadCollection(
  changelogRaw,
  (slug, fm, content, html) => ({
    title: fm.title as string,
    publishedAt: toIsoDate(fm.publishedAt as string, "publishedAt"),
    slug,
    content,
    contentHtml: html,
  }),
);

export const allGuides: Guide[] = await loadCollection(
  guidesRaw,
  (slug, fm, content, html) => ({
    title: fm.title as string,
    slug: (fm.slug as string) ?? slug,
    description: fm.description as string,
    order: fm.order as number,
    svgLight: fm.svgLight as string | undefined,
    svgDark: fm.svgDark as string | undefined,
    content,
    contentHtml: html,
  }),
);

export const allLegalDocuments: LegalDocument[] = await loadCollection(
  legalRaw,
  (slug, fm, content, html) => ({
    title: fm.title as string,
    slug: (fm.slug as string) ?? slug,
    description: fm.description as string,
    updatedAt: toIsoDate(fm.updatedAt as string, "updatedAt"),
    order: fm.order as number,
    content,
    contentHtml: html,
  }),
);
