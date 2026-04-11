import markdownToHtml from "./markdownToHtml";
import type { MarkdownContent } from "./types";

const helpMarkdownModules = import.meta.glob("../content/help/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const changelogMarkdownModules = import.meta.glob("../content/changelog/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

type FrontmatterValue = boolean | number | string | null;

type ParsedFrontmatter = {
  content: string;
  data: Record<string, FrontmatterValue>;
};

const FRONTMATTER_DELIMITER = "---";
const FRONTMATTER_PATTERN =
  /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

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
    throw new Error(
      `Missing ${FRONTMATTER_DELIMITER} frontmatter block in ${filePath}`,
    );
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

function mapMarkdownModules(
  modules: Record<string, string>,
): MarkdownContent[] {
  return Object.entries(modules)
    .map(([filePath, rawMarkdown]) => {
      const { content, data } = parseFrontmatter(rawMarkdown, filePath);
      const slug = filePath.split("/").pop()?.replace(".md", "");

      if (!slug) {
        throw new Error(`Unable to derive slug for markdown file: ${filePath}`);
      }

      const publishedAtValue = readRequiredString(data, "publishedAt", filePath);
      const publishedAt = new Date(publishedAtValue);

      if (Number.isNaN(publishedAt.getTime())) {
        throw new Error(
          `Invalid "publishedAt" date "${publishedAtValue}" in ${filePath}`,
        );
      }

      return {
        content: markdownToHtml(content),
        title: readRequiredString(data, "title", filePath),
        slug,
        publishedAt,
        description: readOptionalString(data, "description", filePath) ?? "",
        category: readOptionalString(data, "category", filePath),
      };
    })
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

const markdownCollections = {
  "src/content/help/": mapMarkdownModules(helpMarkdownModules),
  "src/content/changelog/": mapMarkdownModules(changelogMarkdownModules),
} as const;

export const getMarkDownContent = (folder: string, slug: string) => {
  return getMarkDownData(folder).find((entry) => entry.slug === slug);
};

export const getMarkDownData = (folder: string) => {
  const collection =
    markdownCollections[folder as keyof typeof markdownCollections];

  if (!collection) {
    throw new Error(`Unsupported markdown folder: ${folder}`);
  }

  return collection;
};
