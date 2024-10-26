import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guides } from "../../guides";
import markdownToHtml from "@/lib/markdownToHtml";

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
    <article className="mx-auto grid w-full max-w-2xl gap-4 py-4 md:py-10">
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
        <CardContent className="max-w-none p-0 border-t-[0.5px] divide-y-[0.5px] mt-4">
          {guide.steps?.map((step, index) => (
            <div key={step.title} className="grid grid-cols-6 gap-2 px-6 py-4">
              <p className="font-mono uppercase text-sm text-primary font-medium select-none">Step {index + 1}</p>
              <div className="col-span-5 text-sm">
                <p>{step.title}</p>
                {step.code && <div className="rounded mt-4 [&>pre]:rounded-md [&>pre]:p-2 [&>pre]:overflow-x-auto [&>code]:overflow-x-auto overflow-hidden" dangerouslySetInnerHTML={{ __html: markdownToHtml(`\`\`\`${step.codeLang}\n${step.code}\n\`\`\``) }} />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </article >
  );
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}
