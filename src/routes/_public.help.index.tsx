import Guides from "@/components/help/guides";
import { buttonVariants } from "@/components/ui/button";
import { guideLinks, helpCategories, type HelpCategory } from "@/lib/content";
import { buildSeoMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronRight, Mail } from "vadivam-react";

const helpDescription =
  "Find solutions to common issues and get help with troubleshooting.";

export const Route = createFileRoute("/_public/help/")({
  head: () =>
    buildSeoMeta({
      title: "Help & Support",
      description: helpDescription,
      path: "/help",
    }),
  component: HelpPage,
});

function HelpSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-muted-foreground text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

function CategoryList({ category }: { category: HelpCategory }) {
  return (
    <HelpSection title={category.category}>
      <ul className="bg-card divide-y overflow-hidden rounded-xl border shadow-xs">
        {category.entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              to="/help/$slug"
              params={{ slug: entry.slug }}
              className="group hover:bg-muted/50 flex items-center gap-4 px-4 py-3.5 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{entry.title}</p>
                {entry.description ? (
                  <p className="text-muted-foreground mt-0.5 truncate text-sm">
                    {entry.description}
                  </p>
                ) : null}
              </div>
              <ChevronRight
                className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </HelpSection>
  );
}

function ContactSection() {
  return (
    <section className="bg-surface flex flex-col items-start justify-between gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center">
      <div>
        <h2 className="font-medium">Still need help?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Can&apos;t find what you&apos;re looking for? Get in touch with
          support.
        </p>
      </div>
      <div className="flex gap-2">
        <a
          href="mailto:hello@praveenjuge.com"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          <Mail />
          Email support
        </a>
        <a
          href="https://x.com/PraveenJuge"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Message on X
        </a>
      </div>
    </section>
  );
}

function HelpPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Help &amp; Support
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          {helpDescription}
        </p>
      </header>
      <HelpSection title="Framework guides">
        <Guides guides={guideLinks} />
      </HelpSection>
      {helpCategories.map((category) => (
        <CategoryList key={category.category} category={category} />
      ))}
      <ContactSection />
    </div>
  );
}
