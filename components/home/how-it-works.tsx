import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Add your Website",
    description: "Connect your site to Mosaic with just a few clicks",
  },
  {
    title: "We Generate an OG Image",
    description:
      "Mosaic automatically grabs a beautiful OG Image of your website's hero section",
  },
  {
    title: "Add the OG Image to Your Site",
    description:
      "Insert the generated link in your meta tags for instant previews",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto my-26 max-w-4xl md:text-center">
      <h2 className="mb-10 text-4xl font-semibold tracking-tight">
        How it Works
      </h2>
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
