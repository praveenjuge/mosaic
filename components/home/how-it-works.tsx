import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Add your website URL",
    description: "Drop in your homepage link and connect your site in minutes.",
  },
  {
    title: "We capture + design",
    description:
      "Mosaic screenshots your hero and creates a share-ready OG image.",
  },
  {
    title: "Paste one meta tag",
    description: "Use the provided og:image URL to get instant social previews.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto my-26 max-w-4xl md:text-center">
      <h2 className="mb-10 text-4xl font-semibold tracking-tight">
        How it Works
      </h2>
      <p className="text-muted-foreground mx-auto mb-10 max-w-[560px] text-balance text-base md:text-lg">
        Add your URL, we generate a beautiful OG image from your page, and you
        paste a single meta tag. That&apos;s it.
      </p>
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col gap-3 md:items-center">
            <span
              className={cn(
                "bg-primary text-background grid size-10 place-items-center rounded-full font-medium",
              )}
            >
              {index + 1}
            </span>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
