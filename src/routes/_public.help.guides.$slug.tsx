import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { guides } from "@/lib/help-guides";
import markdownToHtml from "@/lib/markdownToHtml";
import { absoluteUrl, buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/help/guides/$slug")({
  loader: ({ params }) => {
    const guide = guides.find((entry) => entry.slug === params.slug);
    if (!guide) {
      throw notFound();
    }

    return { guide };
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.guide.title;
    const description = `Get started with integrating Mosaic into your ${title} project.`;
    const seo = buildSeoMeta({
      title,
      description,
      image: getOgImageUrl(`help/guides/${params.slug}`),
      path: `/help/guides/${params.slug}`,
      type: "article",
    });

    return {
      ...seo,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: title,
            description,
            url: absoluteUrl(`/help/guides/${params.slug}`),
          }),
        },
      ],
    };
  },
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
          <CardDescription>
            Get started with integrating Mosaic into your {guide.title} project.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 divide-y-[0.5px] border-t-[0.5px] p-0">
          {guide.steps?.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col gap-4 px-6 py-4 sm:grid sm:grid-cols-6"
            >
              <p className="text-primary shrink-0 font-mono font-medium uppercase select-none">
                Step {index + 1}
              </p>
              <div className="gap-4 sm:col-span-5">
                <p>{step.title}</p>
                {step.code ? (
                  <div
                    className="mt-4 overflow-hidden rounded [&>code]:overflow-x-auto [&>pre]:overflow-x-auto [&>pre]:rounded-md [&>pre]:p-2"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(
                        `\`\`\`${step.codeLang}\n${step.code}\n\`\`\``,
                      ),
                    }}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </article>
  );
}
