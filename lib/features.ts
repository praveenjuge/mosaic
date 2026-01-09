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

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
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
] as const;
