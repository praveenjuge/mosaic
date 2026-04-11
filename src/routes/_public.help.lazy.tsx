import Guides from "@/components/help/guides";
import type { HelpCategory } from "@/lib/content";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Link,
  Outlet,
  createLazyFileRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Mail } from "lucide-react";

const helpDescription =
  "Find solutions to common issues and get help with troubleshooting.";

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

export const Route = createLazyFileRoute("/_public/help")({
  component: HelpPage,
});

function HelpHeader() {
  return (
    <CardHeader className="p-0">
      <CardTitle>Help & Support</CardTitle>
      <CardDescription>{helpDescription}</CardDescription>
    </CardHeader>
  );
}

function HelpCategoriesSection({
  helpCategories,
}: {
  helpCategories: HelpCategory[];
}) {
  return (
    <>
      {helpCategories.map((category) => (
        <Card key={category.category} className="gap-2">
          <CardHeader>
            <CardTitle>{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            {category.entries.map((entry) => (
              <Link
                key={entry.slug}
                to="/help/$slug"
                params={{ slug: entry.slug }}
                className="hover:bg-muted/50 block rounded-lg p-2 transition-colors"
              >
                <p className="font-medium">{entry.title}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function ContactSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Still Need Help?</CardTitle>
        <CardDescription>
          Can&apos;t find what you&apos;re looking for? Get in touch with our
          support team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="mailto:hello@praveenjuge.com"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Mail className="size-4" />
            Email Support
          </a>
          <a
            href="https://x.com/PraveenJuge"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Twitter Support
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function HelpPage() {
  const { guides, helpCategories } = Route.useLoaderData();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (normalizePathname(pathname) !== "/help") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 py-4 md:py-10">
      <HelpHeader />
      <Guides guides={guides} />
      <HelpCategoriesSection helpCategories={helpCategories} />
      <ContactSection />
    </div>
  );
}
