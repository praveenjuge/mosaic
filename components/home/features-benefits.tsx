import { FEATURES } from "@/lib/features";

export default function FeaturesBenefits() {
  return (
    <section className="mx-auto max-w-4xl py-8 md:text-center">
      <h2 className="mb-10 text-4xl font-semibold tracking-tight">
        Features & Benefits
      </h2>
      <ul className="grid gap-8 md:gap-12 md:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex md:flex-col gap-2 md:items-center">
            <Icon className="text-primary size-6 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-medium">{title}</h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
