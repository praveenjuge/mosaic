import { fromHighlighter } from "@shikijs/markdown-it/core";
import MarkdownIt from "markdown-it";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

const md = new MarkdownIt({
  html: true,
  typographer: true,
});

const defaultLinkRender =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrPush(["target", "_blank"]);
  token.attrPush(["rel", "noopener noreferrer"]);
  return defaultLinkRender(tokens, idx, options, env, self);
};

md.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx];
  const href = token.attrGet("src");
  return `<a target="_blank" rel="noreferrer noopener" href="${href}">
            <img src="${href}" alt="${token.content}" loading="lazy" />
          </a>`;
};

const highlighter = await createHighlighterCore({
  themes: [import("shiki/themes/github-dark.mjs")],
  langs: [
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/docker.mjs"),
    import("shiki/langs/bash.mjs"),
    import("shiki/langs/python.mjs"),
    import("shiki/langs/yaml.mjs"),
    import("shiki/langs/html.mjs"),
    import("shiki/langs/astro.mjs"),
    import("shiki/langs/vue.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/mdx.mjs"),
    import("shiki/langs/markdown.mjs"),
    import("shiki/langs/svelte.mjs"),
    import("shiki/langs/php.mjs"),
    import("shiki/langs/jsx.mjs"),
  ],
  engine: createOnigurumaEngine(() => import("shiki/wasm")),
});
md.use(
  fromHighlighter(highlighter as never, {
    themes: {
      light: "github-dark",
    },
  }),
);

export default function markdownToHtml(markdown: string) {
  return md.render(markdown);
}
