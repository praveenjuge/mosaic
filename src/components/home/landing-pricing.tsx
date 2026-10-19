import PricingTable from "@/components/pricing-table";
import { SectionHeading } from "./section-heading";

export default function LandingPricing() {
  return (
    <section id="pricing" className="flex flex-col gap-12">
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        description="Start for free and upgrade when you need more. No hidden fees, cancel anytime."
      />
      <PricingTable />
    </section>
  );
}
