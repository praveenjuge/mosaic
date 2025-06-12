import PricingTable from "@/components/pricing-table";

export default function LandingPricing() {
  return (
    <section className="mx-auto max-w-6xl py-10">
      <div className="mb-8 text-center">
        <h2 className="mb-4 text-4xl font-semibold tracking-tighter">
          Simple, Transparent Pricing
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Start for free and upgrade when you need more. No hidden fees, no
          surprises.
        </p>
      </div>
      <PricingTable />
    </section>
  );
}
