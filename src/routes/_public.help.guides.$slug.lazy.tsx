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
        <CardContent className="mt-4 divide-y-[0.5px] border-t-[0.5px] p-0">
          {guide.steps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col gap-4 px-6 py-4 sm:grid sm:grid-cols-6"
            >
              <p className="text-primary shrink-0 font-mono font-medium uppercase select-none">
                Step {index + 1}
              </p>
              <div className="gap-4 sm:col-span-5">
                <p>{step.title}</p>
                {step.codeHtml ? (
                  <div
                    className="mt-4 overflow-hidden rounded [&>code]:overflow-x-auto [&>pre]:overflow-x-auto [&>pre]:rounded-md [&>pre]:p-2"
                    dangerouslySetInnerHTML={{ __html: step.codeHtml }}
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
