import {
  ChartBarIncreasingSolid,
  GlobeSolid,
  HeartCircleSolid,
  ImageRectangleSolid,
  ImageSolid,
  LayoutSolid,
  PuzzleSolid,
  RefreshAltSolid,
} from "@mynaui/icons-react";

const features = [
  {
    icon: ImageRectangleSolid,
    title: "Automated OG Images",
    description: "Create Images automatically as soon as you publish.",
  },
  {
    icon: PuzzleSolid,
    title: "Seamless Integrations",
    description: "Add a single script tag to get started in minutes.",
  },
  {
    icon: HeartCircleSolid,
    title: "Beautiful Social Previews",
    description: "Engage your audience with eye-catching OG images.",
  },
  {
    icon: ImageSolid,
    title: "Retina-Ready Quality",
    description: "Crisp images delivered in high resolution.",
  },
  {
    icon: GlobeSolid,
    title: "Global CDN",
    description: "Fast delivery from edge locations worldwide.",
  },
  {
    icon: LayoutSolid,
    title: "Simple Dashboard",
    description: "Manage multiple websites in one place.",
  },
  {
    icon: RefreshAltSolid,
    title: "Refresh OG Images",
    description: "Update previews whenever your design changes.",
  },
  {
    icon: ChartBarIncreasingSolid,
    title: "Advanced Analytics",
    description: "Track impressions and usage on every image.",
  },
];

export default function FeaturesBenefits() {
  return (
    <section className="mx-auto max-w-4xl py-8 md:text-center">
      <h2 className="mb-10 text-4xl font-semibold tracking-tight">
        Features & Benefits
      </h2>
      <ul className="grid gap-8 md:gap-12 md:grid-cols-4">
        {features.map(({ icon: Icon, title, description }) => (
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
