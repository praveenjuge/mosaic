import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import markdownToHtml from "./src/lib/markdownToHtml";

// ── Shared Helpers ──────────────────────────────────────────────────

function toIsoDate(value: string, field: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} date: ${value}`);
  }
  return date.toISOString();
}

/**
 * Shared transform that converts markdown to HTML, derives a slug,
 * and optionally converts date string fields to ISO format.
 *
 * @param entry  - The raw content-collection entry.
 * @param dates  - Map of `{ outputKey: rawDateString }` pairs to normalise.
 */
function withMarkdown<T extends { content: string; _meta: { path: string } }>(
  entry: T,
  dates?: Record<string, string>,
) {
  const normalizedDates = dates
    ? Object.fromEntries(
        Object.entries(dates).map(([key, value]) => [key, toIsoDate(value, key)]),
      )
    : {};

  return {
    ...entry,
    slug: entry._meta.path,
    contentHtml: markdownToHtml(entry.content),
    ...normalizedDates,
  };
}

// ── Collections ─────────────────────────────────────────────────────

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
    ...withMarkdown(entry, { publishedAt: entry.publishedAt }),
    description: entry.description ?? "",
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
  transform: async (entry) =>
    withMarkdown(entry, { publishedAt: entry.publishedAt }),
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
  transform: async (entry) => withMarkdown(entry),
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
  transform: async (entry) =>
    withMarkdown(entry, { updatedAt: entry.updatedAt }),
});

export default defineConfig({
  content: [helpArticles, changelogEntries, guides, legalDocuments],
});
