import { publicEnv } from "@/lib/env";
import { buildUseEndpointUrl } from "@/lib/url";
import { SectionHeading } from "./section-heading";

const steps = [
  {
    title: "Add your website",
    description:
      "Sign up and enter your domain. Mosaic captures your home page right away.",
  },
  {
    title: "Add one meta tag",
    description:
      "Point og:image at your Mosaic link. Each page's address goes in the url parameter.",
  },
  {
    title: "Share your links",
    description:
      "When a link is shared, its crawler gets a screenshot of that page, cached and refreshed for you.",
  },
];

const useUrl = buildUseEndpointUrl(publicEnv.siteUrl, "https://example.com");

function MetaTagSnippet() {
  return (
    <figure className="bg-primary text-primary-foreground overflow-hidden rounded-2xl border shadow-sm dark:bg-black/40 dark:text-white">
      <figcaption className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="ml-2 font-mono text-xs text-white/50">index.html</span>
      </figcaption>
      <pre className="p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
        <code>
          <span className="text-white/50">{"<head>"}</span>
          {"\n  "}
          <span className="text-white/50">{"<"}</span>
          <span className="text-emerald-300">meta</span>
          {"\n    "}
          <span className="text-sky-300">property</span>
          <span className="text-white/50">=</span>
          <span className="text-amber-200">&quot;og:image&quot;</span>
          {"\n    "}
          <span className="text-sky-300">content</span>
          <span className="text-white/50">=</span>
          <span className="break-all text-amber-200">&quot;{useUrl}&quot;</span>
          {"\n  "}
          <span className="text-white/50">{"/>"}</span>
          {"\n"}
          <span className="text-white/50">{"</head>"}</span>
        </code>
      </pre>
    </figure>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
    >
      <div className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="How it works"
          title="Live in about a minute"
          description="No build step, no image templates, no API keys."
        />
        <ol className="flex flex-col gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="text-muted-foreground grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs">
                {index + 1}
              </span>
              <div className="space-y-1">
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <MetaTagSnippet />
    </section>
  );
}
