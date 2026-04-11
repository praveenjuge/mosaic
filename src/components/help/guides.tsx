import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guides, type HelpGuide } from "@/lib/help-guides";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function GuideLink({ guide }: { guide: HelpGuide }) {
  return (
    <Link
      to="/help/guides/$slug"
      params={{ slug: guide.slug }}
      className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
    >
      <img
        alt={`${guide.title} icon`}
        className={cn(
          "shrink-0 select-none not-dark:block dark:hidden",
          guide.slug === "hugo" ? "size-12" : "size-4",
        )}
        src={
          guide.svgLight
            ? `https://svgl.app/library/${guide.svgLight}.svg`
            : `https://svgl.app/library/${guide.slug}.svg`
        }
        width={100}
        height={100}
        loading="lazy"
      />
      <img
        alt={`${guide.title} icon`}
        className={cn(
          "shrink-0 select-none not-dark:hidden dark:block",
          guide.slug === "hugo" ? "size-12" : "size-4",
        )}
        src={
          guide.svgDark
            ? `https://svgl.app/library/${guide.svgDark}.svg`
            : `https://svgl.app/library/${guide.slug}.svg`
        }
        width={100}
        height={100}
        loading="lazy"
      />
      {guide.title}
      <ChevronRight className="text-muted-foreground size-4 stroke-2" />
    </Link>
  );
}

export default function Guides() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Framework Guides</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {guides.map((guide) => (
          <GuideLink key={guide.slug} guide={guide} />
        ))}
      </CardContent>
    </Card>
  );
}
