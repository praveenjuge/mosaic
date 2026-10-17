import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { legalDocuments } from "@/lib/content";
import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/url";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/legal")({
  component: LegalPage,
  head: () =>
    buildSeoMeta({
      title: "Legal Information",
      description: "We take your privacy and data seriously.",
      image: getOgImageUrl("legal"),
      path: "/legal",
    }),
});

function LegalPage() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>Legal Information</CardTitle>
        <CardDescription>
          We take your privacy and data seriously.
        </CardDescription>
      </CardHeader>
      {legalDocuments.map((document) => (
        <Card key={document.slug} id={document.slug}>
          <CardHeader>
            <CardTitle>{document.title}</CardTitle>
            <CardDescription>
              Last updated:{" "}
              {new Date(document.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent
            className="prose prose-sm prose-zinc dark:prose-invert max-w-none [&_pre]:overflow-x-auto [&>pre]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: document.contentHtml }}
          />
        </Card>
      ))}
    </div>
  );
}
