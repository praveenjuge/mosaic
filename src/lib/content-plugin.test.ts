import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  loadContent,
  parseFrontmatter,
  renderMarkdown,
} from "./content-plugin";

describe("parseFrontmatter", () => {
  test("reads YAML frontmatter and the body", () => {
    expect(
      parseFrontmatter('---\ntitle: "Hi: there"\norder: 3\n---\n\nBody\n'),
    ).toEqual({ data: { title: "Hi: there", order: 3 }, body: "\nBody\n" });
  });

  test("treats a file without frontmatter as all body", () => {
    expect(parseFrontmatter("# Title")).toEqual({ data: {}, body: "# Title" });
  });
});

describe("renderMarkdown", () => {
  test("highlights code and opens only external links in a new tab", async () => {
    const html = await renderMarkdown(
      "[out](https://example.com) [in](/help)\n\n```bash\necho hi\n```\n",
    );
    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">',
    );
    expect(html).toContain('<a href="/help">');
    expect(html).toContain('class="shiki github-dark"');
  });

  test("lazy-loads images and links them to themselves", async () => {
    expect(await renderMarkdown("![Alt](/a.png)")).toContain(
      '<a href="/a.png" target="_blank" rel="noopener noreferrer"><img src="/a.png" alt="Alt" loading="lazy"></a>',
    );
  });

  test("sizes images from public/ so the page doesn't shift", async () => {
    expect(
      await renderMarkdown("![Alt](/images/mosaic-example-og-f9e253a9.png)"),
    ).toContain('loading="lazy" width="1200" height="630"');
  });
});

describe("loadContent", () => {
  test("loads every content file with valid, unique slugs", async () => {
    const content = await loadContent(
      path.resolve(import.meta.dir, "../content"),
      path.resolve(import.meta.dir, "../../public/llms.txt"),
    );

    for (const list of [
      content.helpArticles,
      content.guides,
      content.legalDocuments,
    ]) {
      expect(list.length).toBeGreaterThan(0);
      const slugs = list.map((entry) => entry.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const entry of list)
        expect(entry.contentHtml.length).toBeGreaterThan(0);
    }

    expect(content.guideLinks).toHaveLength(content.guides.length);
    expect(
      content.helpCategories.flatMap((category) => category.entries),
    ).toHaveLength(content.helpArticles.length);
    for (const page of ["/", "/help", "/legal"]) {
      expect(content.markdownPages[page]).toStartWith("#");
    }
    for (const guide of content.guides) {
      expect(content.markdownPages[`/help/guides/${guide.slug}`]).toStartWith(
        `# ${guide.title}\n`,
      );
    }
  });

  test("internal links point at content pages or public files", async () => {
    const content = await loadContent(
      path.resolve(import.meta.dir, "../content"),
      path.resolve(import.meta.dir, "../../public/llms.txt"),
    );
    const publicDir = path.resolve(import.meta.dir, "../../public");
    const html = [
      ...content.helpArticles,
      ...content.guides,
      ...content.legalDocuments,
    ]
      .map((entry) => entry.contentHtml)
      .join("\n");

    const targets = [...html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)].map(
      (match) => match[1],
    );
    expect(targets.length).toBeGreaterThan(0);
    for (const target of new Set(targets)) {
      expect(
        Object.hasOwn(content.markdownPages, target) ||
          existsSync(path.join(publicDir, target)),
        `broken internal link: ${target}`,
      ).toBe(true);
    }
  });
});
