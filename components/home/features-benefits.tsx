import {
  ChartLineSolid,
  GlobeSolid,
  HeartCircleSolid,
  ImageRectangleSolid,
  LayoutSolid,
  LinkSolid,
  RefreshSolid,
  ImageSolid,
} from "@mynaui/icons-react";

const features = [
  {
    icon: ImageRectangleSolid,
    title: "Automated OG image generation",
    description: "Create OG images automatically as soon as you publish.",
  },
  {
    icon: LinkSolid,
    title: "Seamless integration",
    description: "Add a single script tag to get started in minutes.",
  },
  {
    icon: HeartCircleSolid,
    title: "Beautiful social previews",
    description: "Engage your audience with eye‑catching OG images.",
  },
  {
    icon: ImageSolid,
    title: "Retina‑ready quality",
    description: "Crisp images delivered in high resolution.",
  },
  {
    icon: GlobeSolid,
    title: "Global CDN",
    description: "Fast delivery from edge locations worldwide.",
  },
  {
    icon: LayoutSolid,
    title: "Simple dashboard",
    description: "Manage multiple websites in one place.",
  },
  {
    icon: RefreshSolid,
    title: "Refresh OG images",
    description: "Update previews whenever your design changes.",
  },
  {
    icon: ChartLineSolid,
    title: "Advanced analytics",
    description: "Track impressions and usage on every image.",
  },
];

export default function FeaturesBenefits() {
  return (
    <section className="mx-auto max-w-4xl py-8 md:text-center">
      <h2 className="mb-10 text-4xl font-semibold tracking-tight">
        Features & Benefits
      </h2>
      <ul className="grid gap-8 md:grid-cols-2">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex gap-3 md:items-start">
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
