import FAQComponent, { faqs } from "@/components/faq";
import PricingTable from "@/components/pricing-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for Mosaic. Choose the plan that fits your needs.",
  openGraph: {
    images: [getOgImageUrl("pricing")],
  },
};

function FAQSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

interface PricingPageProps {
  searchParams: Promise<{
    customer_session_token?: string;
  }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="space-y-16">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="space-y-4">
        <h1 className="text-foreground text-3xl font-semibold">Pricing</h1>
        <p className="text-muted-foreground">
          Simple, transparent pricing. Choose the plan that fits your needs.
        </p>
      </div>

      <div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-lg" />
              ))}
            </div>
          }
        >
          <PricingTable />
        </Suspense>
      </div>

      <div className="space-y-4">
        <h2 className="text-foreground text-2xl font-semibold">
          Frequently Asked Questions
        </h2>
        <Suspense fallback={<FAQSkeleton />}>
          <FAQComponent showCard={false} />
        </Suspense>
      </div>
    </div>
  );
}
