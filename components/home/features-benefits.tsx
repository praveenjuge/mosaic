import { CheckHexagon } from "@mynaui/icons-react";

const features = [
  "Automated OG image generation from your web pages",
  "Seamless integration with minimal setup",
  "Beautiful social previews that boost engagement",
  "High-quality, retina-ready OG Images",
  "Global CDN for fast OG Image delivery",
  "Simple dashboard for managing multiple websites",
  '"Refresh OG Images" option when your site design changes',
  "Advanced analytics and usage tracking for Pro users",
];

export default function FeaturesBenefits() {
  return (
    <section className="mx-auto max-w-4xl py-8 md:text-center">
      <h2 className="mb-10 text-4xl font-semibold tracking-tight">
        Features & Benefits
      </h2>
      <ul className="grid items-center gap-4">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-base md:justify-center"
          >
            <CheckHexagon className="text-primary size-5 shrink-0 stroke-2" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
