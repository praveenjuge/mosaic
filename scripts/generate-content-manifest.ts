import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { guides } from "../src/lib/help-guides";
import markdownToHtml from "../src/lib/markdownToHtml";
import type {
  ContentCategory,
  ContentEntry,
  GeneratedHelpGuide,
} from "../src/lib/types";

type FrontmatterValue = boolean | number | string | null;

type ParsedFrontmatter = {
  content: string;
  data: Record<string, FrontmatterValue>;
};

const FRONTMATTER_PATTERN =
  /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = resolve(dirname(scriptPath), "..");
const outputFile = resolve(rootDir, "src/generated/content.ts");

function serialize(value: unknown) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003C");
}

function parseFrontmatterValue(
  rawValue: string,
  filePath: string,
  key: string,
): FrontmatterValue {
  if (rawValue.startsWith('"')) {
    try {
      const value = JSON.parse(rawValue);

      if (typeof value !== "string") {
        throw new Error();
      }

      return value;
    } catch {
      throw new Error(
        `Invalid double-quoted frontmatter value for "${key}" in ${filePath}`,
      );
    }
  }

  if (rawValue.startsWith("'")) {
    if (!rawValue.endsWith("'")) {
      throw new Error(
        `Unterminated single-quoted frontmatter value for "${key}" in ${filePath}`,
      );
    }

    return rawValue.slice(1, -1).replaceAll("''", "'");
  }

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  if (rawValue === "null") {
    return null;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) {
    return Number(rawValue);
  }

  return rawValue;
}

function parseFrontmatter(rawMarkdown: string, filePath: string): ParsedFrontmatter {
  const match = rawMarkdown.match(FRONTMATTER_PATTERN);

  if (!match) {
    throw new Error(`Missing frontmatter block in ${filePath}`);
  }

  const [, frontmatterBlock] = match;
  const data: Record<string, FrontmatterValue> = {};

  frontmatterBlock.split(/\r?\n/).forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf(":");

    if (separatorIndex <= 0) {
      throw new Error(
        `Invalid frontmatter line ${index + 1} in ${filePath}: ${trimmedLine}`,
      );
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

    if (!rawValue) {
      throw new Error(`Missing frontmatter value for "${key}" in ${filePath}`);
    }

    data[key] = parseFrontmatterValue(rawValue, filePath, key);
  });

  return {
    content: rawMarkdown.slice(match[0].length),
    data,
  };
}

function readRequiredString(
  data: Record<string, FrontmatterValue>,
  key: string,
  filePath: string,
) {
  const value = data[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected "${key}" to be a non-empty string in ${filePath}`);
  }

  return value;
}

function readOptionalString(
  data: Record<string, FrontmatterValue>,
  key: string,
  filePath: string,
) {
  const value = data[key];

  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Expected "${key}" to be a string in ${filePath}`);
  }

  return value;
}

async function readMarkdownEntries(directory: string): Promise<ContentEntry[]> {
  const files = (await readdir(directory))
    .filter((file) => extname(file) === ".md")
    .sort();

  const entries = await Promise.all(
    files.map(async (fileName) => {
      const filePath = resolve(directory, fileName);
      const rawMarkdown = await readFile(filePath, "utf8");
      const { content, data } = parseFrontmatter(rawMarkdown, filePath);
      const publishedAtValue = readRequiredString(data, "publishedAt", filePath);
      const publishedAt = new Date(publishedAtValue);

      if (Number.isNaN(publishedAt.getTime())) {
        throw new Error(
          `Invalid "publishedAt" date "${publishedAtValue}" in ${filePath}`,
        );
      }

      return {
        category: readOptionalString(data, "category", filePath),
        contentHtml: markdownToHtml(content),
        description: readOptionalString(data, "description", filePath) ?? "",
        publishedAt: publishedAt.toISOString(),
        slug: fileName.replace(/\.md$/, ""),
        title: readRequiredString(data, "title", filePath),
      } satisfies ContentEntry;
    }),
  );

  return entries.sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

function groupHelpEntries(entries: ContentEntry[]): ContentCategory[] {
  const groupedEntries = new Map<string, ContentCategory["entries"]>();

  entries.forEach((entry) => {
    const category = entry.category ?? "General";
    const categoryEntries = groupedEntries.get(category) ?? [];

    categoryEntries.push({
      slug: entry.slug,
      title: entry.title,
    });

    groupedEntries.set(category, categoryEntries);
  });

  return Array.from(groupedEntries.entries()).map(([category, grouped]) => ({
    category,
    entries: grouped,
  }));
}

function buildGuides(): GeneratedHelpGuide[] {
  return guides.map((guide) => ({
    ...guide,
    description: `Get started with integrating Mosaic into your ${guide.title} project.`,
    steps: guide.steps.map((step) => ({
      ...step,
      codeHtml: step.code
        ? markdownToHtml(`\`\`\`${step.codeLang ?? "text"}\n${step.code}\n\`\`\``)
        : undefined,
    })),
  }));
}

function mapBySlug<T extends { slug: string }>(entries: T[]) {
  return Object.fromEntries(entries.map((entry) => [entry.slug, entry]));
}

async function generateContentManifest() {
  const helpArticles = await readMarkdownEntries(
    resolve(rootDir, "src/content/help"),
  );
  const changelogEntries = await readMarkdownEntries(
    resolve(rootDir, "src/content/changelog"),
  );
  const helpCategories = groupHelpEntries(helpArticles);
  const helpGuides = buildGuides();

  const fileContents = `/* eslint-disable */
/* This file is generated by scripts/generate-content-manifest.ts. */

import type {
  ContentCategory,
  ContentEntry,
  GeneratedHelpGuide,
} from "../lib/types";

export const helpArticles = ${serialize(helpArticles)} satisfies ContentEntry[];

export const helpArticlesBySlug = ${serialize(mapBySlug(helpArticles))} satisfies Record<string, ContentEntry>;

export const helpCategories = ${serialize(helpCategories)} satisfies ContentCategory[];

export const changelogEntries = ${serialize(changelogEntries)} satisfies ContentEntry[];

export const changelogEntriesBySlug = ${serialize(mapBySlug(changelogEntries))} satisfies Record<string, ContentEntry>;

export const helpGuides = ${serialize(helpGuides)} satisfies GeneratedHelpGuide[];

export const helpGuidesBySlug = ${serialize(mapBySlug(helpGuides))} satisfies Record<string, GeneratedHelpGuide>;
`;

  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, fileContents);
}

await generateContentManifest();
