import Footer from "@/components/footer";
import Header from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const destinations = [
  { href: "/", label: "Home", description: "Generate Open Graph images" },
  { href: "/help", label: "Help", description: "Guides and how Mosaic works" },
  {
    href: "/sitemap.xml",
    label: "Sitemap",
    description: "All discoverable pages",
  },
  { href: "/robots.txt", label: "robots.txt", description: "Crawl rules" },
];

/** Rendered by the root route, outside the public layout, so it adds its own. */
export function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}

function NotFoundContent() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <p className="text-brand font-mono text-sm font-medium">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-3">
        The page you were looking for does not exist.
      </p>
      <ul className="mt-8 divide-y border-y">
        {destinations.map(({ href, label, description }) => (
          <li key={href}>
            <a
              href={href}
              className="group hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors"
            >
              <span className="flex-1">
                <span className="block text-sm font-medium">{label}</span>
                <span className="text-muted-foreground block text-sm">
                  {description}
                </span>
              </span>
              <ArrowRight
                className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-8 self-start">
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  );
}
