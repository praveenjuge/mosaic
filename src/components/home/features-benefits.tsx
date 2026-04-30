import {
  type LucideIcon,
  ChartBarIncreasing,
  Globe,
  Heart,
  Image,
  ImagePlus,
  LayoutDashboard,
  Puzzle,
  RefreshCcw,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: ImagePlus,
    title: "Automated OG Images",
    description: "Create Images automatically as soon as you publish.",
  },
  {
    icon: Puzzle,
    title: "Seamless Integrations",
    description: "Add a single script tag to get started in minutes.",
  },
  {
    icon: Heart,
    title: "Beautiful Social Previews",
    description: "Engage your audience with eye-catching OG images.",
  },
  {
    icon: Image,
    title: "Retina-Ready Quality",
    description: "Crisp images delivered in high resolution.",
  },
  {
    icon: Globe,
    title: "Global CDN",
    description: "Fast delivery from edge locations worldwide.",
  },
  {
    icon: LayoutDashboard,
    title: "Simple Dashboard",
    description: "Manage multiple websites in one place.",
  },
  {
    icon: RefreshCcw,
    title: "Refresh OG Images",
    description: "Update previews whenever your design changes.",
  },
  {
    icon: ChartBarIncreasing,
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
      <ul className="grid gap-8 md:grid-cols-4 md:gap-12">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex gap-2 md:flex-col md:items-center">
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
