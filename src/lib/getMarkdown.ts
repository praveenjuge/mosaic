import matter from "gray-matter";
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

function mapMarkdownModules(
  modules: Record<string, string>,
): MarkdownContent[] {
  return Object.entries(modules)
    .map(([filePath, rawMarkdown]) => {
      const data = matter(rawMarkdown);
      const slug = filePath.split("/").pop()?.replace(".md", "");

      if (!slug) {
        throw new Error(`Unable to derive slug for markdown file: ${filePath}`);
      }

      return {
        content: markdownToHtml(data.content),
        title: data.data.title as string,
        slug,
        publishedAt: new Date(String(data.data.publishedAt)),
        description: data.data.description as string,
        category: data.data.category as string | undefined,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
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
