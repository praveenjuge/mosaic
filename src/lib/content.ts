import {
  allChangelogEntries,
  allGuides,
  allHelpArticles,
  allLegalDocuments,
} from "content-collections";

export type HelpArticle = (typeof allHelpArticles)[number];
export type ChangelogEntry = (typeof allChangelogEntries)[number];
export type Guide = (typeof allGuides)[number];
export type LegalDocument = (typeof allLegalDocuments)[number];

export type GuideLinkItem = Pick<
  Guide,
  "description" | "slug" | "svgDark" | "svgLight" | "title"
>;

export type HelpCategory = {
  category: string;
  entries: Array<Pick<HelpArticle, "slug" | "title">>;
};

function sortByNewest<T extends { publishedAt: string }>(entries: T[]) {
  return [...entries].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

function sortByOrder<T extends { order: number }>(entries: T[]) {
  return [...entries].sort((left, right) => left.order - right.order);
}

function groupHelpArticles(entries: HelpArticle[]): HelpCategory[] {
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
const changelogEntries = sortByNewest(allChangelogEntries);
const guides = sortByOrder(allGuides);
const legalDocuments = sortByOrder(allLegalDocuments);

const helpArticleBySlug = new Map(helpArticles.map((entry) => [entry.slug, entry]));
const guideBySlug = new Map(guides.map((entry) => [entry.slug, entry]));

export function getChangelogEntries() {
  return changelogEntries;
}

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
