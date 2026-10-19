import { buttonVariants } from "@/components/ui/button";
import type { GuideLink as GuideLinkItem } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

function GuideIcon({ guide }: { guide: GuideLinkItem }) {
  // Hugo's logo is a wordmark, so it keeps the row height and grows wide.
  const size = guide.slug === "hugo" ? "h-4 w-auto" : "size-4";
  return (
    <>
      <img
        alt=""
        className={cn("shrink-0 select-none not-dark:block dark:hidden", size)}
        src={`https://svgl.app/library/${guide.svgLight ?? guide.slug}.svg`}
        width={100}
        height={100}
        loading="lazy"
      />
      <img
        alt=""
        className={cn("shrink-0 select-none not-dark:hidden dark:block", size)}
        src={`https://svgl.app/library/${guide.svgDark ?? guide.slug}.svg`}
        width={100}
        height={100}
        loading="lazy"
      />
    </>
  );
}

/** A compact link to one framework guide. */
export function GuideLink({ guide }: { guide: GuideLinkItem }) {
  return (
    <Link
      to="/help/guides/$slug"
      params={{ slug: guide.slug }}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "gap-2",
      )}
    >
      <GuideIcon guide={guide} />
      {guide.title}
    </Link>
  );
}

/** Framework guides as a grid of tiles, for the help center. */
export default function Guides({ guides }: { guides: GuideLinkItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {guides.map((guide) => (
        <li key={guide.slug}>
          <Link
            to="/help/guides/$slug"
            params={{ slug: guide.slug }}
            className="bg-card hover:bg-muted/60 flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium shadow-xs transition-colors"
          >
            <GuideIcon guide={guide} />
            {guide.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
