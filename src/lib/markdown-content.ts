/**
 * Resolves the Markdown served for public content routes.
 *
 * Kept separate from markdown-negotiation.ts because it relies on Vite-only
 * build-time imports (import.meta.glob via content-loader, ?raw imports)
 * that do not run under the unit test runner.
 */

import llmsTxt from "@/content/llms.txt?raw";
import { getGuide, getHelpArticle, getLegalDocuments } from "@/lib/content";
import type { MarkdownContentRef } from "@/lib/markdown-negotiation";

function toMarkdownDocument(title: string, content: string): string {
  return `# ${title}\n\n${content.trim()}\n`;
}

export function resolveMarkdownContent(ref: MarkdownContentRef): string | null {
  switch (ref.kind) {
    case "home": {
      // The homepage is a designed landing page without a Markdown body, so
      // agents get the llms.txt site map as its Markdown mirror.
      return `${llmsTxt.trim()}\n`;
    }
    case "help": {
      const article = getHelpArticle(ref.slug);
      return article
        ? toMarkdownDocument(article.title, article.content)
        : null;
    }
    case "guide": {
      const guide = getGuide(ref.slug);
      return guide ? toMarkdownDocument(guide.title, guide.content) : null;
    }
    case "legal": {
      return getLegalDocuments()
        .map((document) => toMarkdownDocument(document.title, document.content))
        .join("\n---\n\n");
    }
  }
}
