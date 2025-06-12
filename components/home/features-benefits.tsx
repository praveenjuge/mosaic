import { CheckHexagon } from "@mynaui/icons-react";

const features = [
  "Automated OG image generation from your web pages",
  "Seamless integration with minimal setup",
  "Beautiful social previews that boost engagement",
  "High-quality, retina-ready images",
  "Global CDN for fast image delivery",
  "Simple dashboard for managing your sites",
  '"Refresh Images" option when your site design has been updated',
];

export default function FeaturesBenefits() {
  return (
    <section className="mx-auto my-14 max-w-4xl">
      <h2 className="mb-8 text-center text-xl font-semibold">Features & Benefits</h2>
      <ul className="grid gap-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-base">
            <CheckHexagon className="text-primary size-5 shrink-0 stroke-2" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
