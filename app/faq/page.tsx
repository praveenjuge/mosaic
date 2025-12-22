import FAQComponent, { faqs } from "@/components/faq";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about Mosaic and how it works.",
  openGraph: {
    images: [getOgImageUrl("faq")],
  },
};

function FAQSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function FAQPage() {
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
    <div className="space-y-10">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="space-y-2">
        <h1 className="text-foreground text-3xl font-semibold">FAQ</h1>
        <p className="text-muted-foreground">
          Find quick answers to the most common questions.
        </p>
      </div>

      <Suspense fallback={<FAQSkeleton />}>
        <FAQComponent />
      </Suspense>
    </div>
  );
}
