import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import markdownToHtml from "@/lib/markdownToHtml";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guides } from "../../guides";

export const dynamic = "force-static";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const guide = guides.find((guide) => guide.slug === params.slug);

  if (!guide) notFound();

  return {
    title: guide.title,
    description: `Get started with integrating Mosaic into your ${guide.title} project.`,
    openGraph: {
      type: "article",
      url: "./",
      locale: "en_US",
      images: {
        url: getOgImageUrl("help/guides/" + params.slug),
        alt: guide.title,
      },
    },
  };
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;

  const guide = guides.find((guide) => guide.slug === params.slug);
  if (!guide) notFound();

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4 md:py-10">
      <CardDescription>
        <Link href="/help">← Help</Link>
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
              <p className="shrink-0 select-none font-mono font-medium uppercase text-primary">
                Step {index + 1}
              </p>
              <div className="gap-4 sm:col-span-5">
                <p>{step.title}</p>
                {step.code && (
                  <div
                    className="mt-4 overflow-hidden rounded [&>code]:overflow-x-auto [&>pre]:overflow-x-auto [&>pre]:rounded-md [&>pre]:p-2"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(
                        `\`\`\`${step.codeLang}\n${step.code}\n\`\`\``,
                      ),
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </article>
  );
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}
