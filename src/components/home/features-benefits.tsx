import {
  type LucideIcon,
  ChartNoAxesColumn,
  Code,
  Globe,
  RefreshCcw,
  ScanEye,
  ShieldCheck,
} from "lucide-react";
import { SectionHeading } from "./section-heading";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: ScanEye,
    title: "Automatic screenshots",
    description:
      "The first request for a page captures it at 1560×819. No templates to design or keep in sync.",
  },
  {
    icon: Code,
    title: "One meta tag",
    description:
      "Point og:image at your Mosaic link. It works with any framework, CMS, or static site.",
  },
  {
    icon: RefreshCcw,
    title: "Always current",
    description:
      "Images refresh every 30 days on their own, or regenerate any page from the dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Clean captures",
    description:
      "Cookie banners, chat widgets, and trackers are left out, so the shot shows your page.",
  },
  {
    icon: Globe,
    title: "Served from the edge",
    description:
      "Images are cached on Cloudflare's network, close to every crawler that asks for them.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Usage at a glance",
    description:
      "See image requests, cache hits, and your most-shared pages for every website.",
  },
];

export default function FeaturesBenefits() {
  return (
    <section id="features" className="flex flex-col gap-12">
      <SectionHeading
        eyebrow="Features"
        title="Everything a link preview needs"
        description="Your website already looks great. Mosaic turns it into the image people see when your links are shared."
      />
      <ul className="bg-border grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <li key={title} className="bg-background flex flex-col gap-3 p-6">
            <span className="bg-muted text-foreground grid size-9 place-items-center rounded-lg border">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <h3 className="font-medium">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
