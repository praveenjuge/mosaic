import { legalDocuments } from "@/lib/content";
import { buildSeoMeta } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/legal")({
  component: LegalPage,
  head: () =>
    buildSeoMeta({
      title: "Legal Information",
      description: "We take your privacy and data seriously.",
      path: "/legal",
    }),
});

function formatUpdated(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function LegalPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Legal Information
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          We take your privacy and data seriously.
        </p>
        <nav aria-label="Documents" className="mt-2 flex flex-wrap gap-2">
          {legalDocuments.map((document) => (
            <a
              key={document.slug}
              href={`#${document.slug}`}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full border px-3 py-1 text-sm transition-colors"
            >
              {document.title}
            </a>
          ))}
        </nav>
      </header>
      {legalDocuments.map((document) => (
        <section
          key={document.slug}
          id={document.slug}
          className="flex flex-col gap-6 border-t pt-10"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {document.title}
            </h2>
            <p className="text-muted-foreground text-sm">
              Last updated {formatUpdated(document.updatedAt)}
            </p>
          </div>
          {/* Build-time HTML from the repo's own Markdown (content-plugin.ts), never request input. nosemgrep */}
          <div
            className="prose prose-sm prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight max-w-none [&_pre]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: document.contentHtml }}
          />
        </section>
      ))}
    </div>
  );
}
