import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import markdownToHtml from "./src/lib/markdownToHtml";

function toIsoDate(value: string, field: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} date: ${value}`);
  }

  return date.toISOString();
}

const helpArticles = defineCollection({
  name: "helpArticles",
  directory: "src/content/help",
  include: "**/*.md",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    publishedAt: z.string(),
    content: z.string(),
  }),
  transform: async (entry) => ({
    ...entry,
    description: entry.description ?? "",
    slug: entry._meta.path,
    publishedAt: toIsoDate(entry.publishedAt, "publishedAt"),
    contentHtml: markdownToHtml(entry.content),
  }),
});

const changelogEntries = defineCollection({
  name: "changelogEntries",
  directory: "src/content/changelog",
  include: "**/*.md",
  schema: z.object({
    title: z.string(),
    publishedAt: z.string(),
    content: z.string(),
  }),
  transform: async (entry) => ({
    ...entry,
    slug: entry._meta.path,
    publishedAt: toIsoDate(entry.publishedAt, "publishedAt"),
    contentHtml: markdownToHtml(entry.content),
  }),
});

const guides = defineCollection({
  name: "guides",
  directory: "src/content/guides",
  include: "**/*.md",
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    order: z.number().int().nonnegative(),
    svgLight: z.string().optional(),
    svgDark: z.string().optional(),
    content: z.string(),
  }),
  transform: async (entry) => ({
    ...entry,
    contentHtml: markdownToHtml(entry.content),
  }),
});

const legalDocuments = defineCollection({
  name: "legalDocuments",
  directory: "src/content/legal",
  include: "**/*.md",
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    updatedAt: z.string(),
    order: z.number().int().nonnegative(),
    content: z.string(),
  }),
  transform: async (entry) => ({
    ...entry,
    updatedAt: toIsoDate(entry.updatedAt, "updatedAt"),
    contentHtml: markdownToHtml(entry.content),
  }),
});

export default defineConfig({
  content: [helpArticles, changelogEntries, guides, legalDocuments],
});
