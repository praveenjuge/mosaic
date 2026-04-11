import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createLazyFileRoute, Link } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_public/help/guides/$slug")({
  component: GuidePage,
});

function GuidePage() {
  const { guide } = Route.useLoaderData();

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4 md:py-10">
      <CardDescription>
        <Link to="/help">{"<-"} Help</Link>
      </CardDescription>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>{guide.title}</CardTitle>
          <CardDescription>{guide.description}</CardDescription>
        </CardHeader>
        <CardContent
          className="prose prose-slate dark:prose-invert mt-4 max-w-none [&>pre]:overflow-x-auto [&_pre]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: guide.contentHtml }}
        />
      </Card>
    </article>
  );
}
