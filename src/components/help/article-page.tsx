import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronRight } from "vadivam-react";

/** A help article or guide: breadcrumbs, a title, and prebuilt HTML. */
export function ArticlePage({
  title,
  eyebrow,
  description,
  html,
  footer,
}: {
  title: string;
  eyebrow: string;
  description?: ReactNode;
  html: string;
  footer?: string;
}) {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground flex items-center gap-1 text-sm"
      >
        <Link to="/help" className="hover:text-foreground transition-colors">
          Help
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span>{eyebrow}</span>
      </nav>
      <header className="mt-6 flex flex-col gap-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground text-base text-balance md:text-lg">
            {description}
          </p>
        ) : null}
      </header>
      {/* Build-time HTML from the repo's own Markdown (content-plugin.ts), never request input. nosemgrep */}
      <div
        className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-xl prose-a:underline-offset-4 prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:border mt-8 max-w-none [&_pre]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {footer ? (
        <aside className="bg-surface text-muted-foreground mt-12 rounded-xl border p-4 text-sm">
          {footer}
        </aside>
      ) : null}
    </article>
  );
}
