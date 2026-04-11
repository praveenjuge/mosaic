import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createLazyFileRoute, Link } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_public/help/$slug")({
  component: HelpArticlePage,
});

function HelpArticlePage() {
  const { help } = Route.useLoaderData();

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4 md:py-10">
      <CardDescription>
        <Link to="/help">{"<-"} Help</Link>
      </CardDescription>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{help.title}</CardTitle>
          {help.category ? (
            <CardDescription>
              <span className="bg-muted text-muted-foreground inline-block rounded px-2 py-1 text-xs font-medium">
                {help.category}
              </span>
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent
          className="prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: help.contentHtml,
          }}
        />
      </Card>
    </article>
  );
}
