export interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  contentHtml: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  order: number;
  svgLight?: string;
  svgDark?: string;
  contentHtml: string;
}

export type GuideLink = Omit<Guide, "contentHtml" | "order">;

export interface LegalDocument {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  order: number;
  contentHtml: string;
}

export type HelpCategory = {
  category: string;
  entries: Array<Pick<HelpArticle, "slug" | "title" | "description">>;
};
