import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** A help article or guide: a back link and one card of prebuilt HTML. */
export function ArticlePage({
  title,
  subtitle,
  html,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  html: string;
  footer?: string;
}) {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4 md:py-10">
      <CardDescription>
        <Link to="/help">{"<-"} Help</Link>
      </CardDescription>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </CardHeader>
        <CardContent
          className="prose prose-slate dark:prose-invert prose-code:before:content-none prose-code:after:content-none max-w-none [&_pre]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {footer ? (
          <CardFooter className="text-muted-foreground text-sm">
            {footer}
          </CardFooter>
        ) : null}
      </Card>
    </article>
  );
}
