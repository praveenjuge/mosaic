import {
  allGuides,
  allHelpArticles,
  allLegalDocuments,
} from "./content-loader";

export type { Guide, HelpArticle, LegalDocument } from "./content-loader";

export type GuideLinkItem = Pick<
  (typeof allGuides)[number],
  "description" | "slug" | "svgDark" | "svgLight" | "title"
>;

export type HelpCategory = {
  category: string;
  entries: Array<Pick<(typeof allHelpArticles)[number], "slug" | "title">>;
};

function sortByNewest<T extends { publishedAt: string }>(entries: T[]) {
  return [...entries].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

function sortByOrder<T extends { order: number }>(entries: T[]) {
  return [...entries].sort((left, right) => left.order - right.order);
}

function groupHelpArticles(entries: typeof allHelpArticles): HelpCategory[] {
  const groupedEntries = new Map<string, HelpCategory["entries"]>();

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

const helpArticles = sortByNewest(allHelpArticles);
const guides = sortByOrder(allGuides);
const legalDocuments = sortByOrder(allLegalDocuments);

const helpArticleBySlug = new Map(
  helpArticles.map((entry) => [entry.slug, entry]),
);
const guideBySlug = new Map(guides.map((entry) => [entry.slug, entry]));

export function getHelpCategories() {
  return groupHelpArticles(helpArticles);
}

export function getGuideLinks(): GuideLinkItem[] {
  return guides.map(({ description, slug, svgDark, svgLight, title }) => ({
    description,
    slug,
    svgDark,
    svgLight,
    title,
  }));
}

export function getHelpArticle(slug: string) {
  return helpArticleBySlug.get(slug);
}

export function getGuide(slug: string) {
  return guideBySlug.get(slug);
}

export function getLegalDocuments() {
  return legalDocuments;
}
