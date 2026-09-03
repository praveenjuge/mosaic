import {
  type LucideIcon,
  ChartBarIncreasing,
  Globe,
  Image,
  ImagePlus,
  LayoutDashboard,
  Puzzle,
  RefreshCcw,
  Share2,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: ImagePlus,
    title: "Automatic screenshots",
    description: "Mosaic captures the page when a preview is requested.",
  },
  {
    icon: Puzzle,
    title: "One meta tag",
    description: "Point og:image at Mosaic. No script, no SDK.",
  },
  {
    icon: Share2,
    title: "Shared cache",
    description: "The same page URL shares one image across everyone.",
  },
  {
    icon: Image,
    title: "1200x630 JPEG",
    description: "Standard social size, served as a JPEG.",
  },
  {
    icon: Globe,
    title: "Cloudflare edge",
    description: "Cached images are served from Cloudflare.",
  },
  {
    icon: LayoutDashboard,
    title: "Simple dashboard",
    description: "Save sites and copy the image URL.",
  },
  {
    icon: RefreshCcw,
    title: "30-day refresh",
    description: "Shared images regenerate automatically after 30 days.",
  },
  {
    icon: ChartBarIncreasing,
    title: "Generation budgets",
    description: "Daily limits; cached images keep serving if we hit them.",
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
