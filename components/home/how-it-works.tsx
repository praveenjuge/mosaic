import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Add your website",
    description: "Connect your site to Mosaic with just a few clicks",
  },
  {
    title: "We take a screenshot",
    description: "Mosaic automatically grabs a beautiful shot of your page",
  },
  {
    title: "Add the OG image to your site",
    description: "Insert the generated link in your meta tags for instant previews",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto my-14 max-w-4xl text-center">
      <h2 className="mb-10 text-xl font-semibold">How it Works</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col items-center gap-3">
            <span
              className={cn(
                "bg-primary text-background grid size-10 place-items-center rounded-full font-medium",
              )}
            >
              {index + 1}
            </span>
            <h3 className="text-base font-semibold">{step.title}</h3>
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
