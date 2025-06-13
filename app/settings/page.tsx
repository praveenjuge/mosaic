import PricingTable from "@/components/pricing-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ModeToggle } from "./theme-toggler";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "You can customize your experience and configure various aspects our service here.",
  openGraph: {
    images: [getOgImageUrl("settings")],
  },
};

const faqs = [
  {
    question: "What is an OG Image?",
    answer:
      "An OG Image, or Open Graph Image, is a preview image that appears when you share a link to your website on social media. It helps your posts stand out with a visual summary of the page.",
  },
  {
    question: "How does the Free plan work?",
    answer:
      "The Free plan gives you 500 OG images per month for one website. Perfect for personal projects or trying out the service.",
  },
  {
    question: "What are the benefits of upgrading to Pro?",
    answer:
      "Pro plans offer higher limits (5,000 images/month or unlimited for yearly), unlimited websites, priority email support, and advanced analytics. Pro Yearly also includes custom branding options.",
  },
  {
    question: "What happens when I hit my plan limit?",
    answer:
      "New images won't be generated until your next billing cycle, but your existing ones stay available. You can upgrade to a higher plan anytime for more capacity.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your Pro subscription at any time. You'll continue to have access to Pro features until the end of your current billing period.",
  },
  {
    question: "How often are OG images refreshed?",
    answer:
      "Images are generated once per page and cached. You can manually refresh them from your dashboard if needed.",
  },
  {
    question: "What image format is used?",
    answer:
      "All OG images are generated as high-quality PNG files at 1200x630 pixels, the standard size for social media previews.",
  },
];

// Loading skeletons
function ThemeToggleSkeleton() {
  return <Skeleton className="h-10 w-32" />;
}

function PricingTableSkeleton() {
  return <Skeleton className="h-64 w-full rounded-lg" />;
}

function FAQSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

// Theme settings component
function ThemeSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose how you want the application to look.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ThemeToggleSkeleton />}>
          <ModeToggle />
        </Suspense>
      </CardContent>
    </Card>
  );
}

// Plan and billing component
function PlanAndBilling() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan & Billing</CardTitle>
        <CardDescription>
          Manage your subscription and billing preferences. Upgrade or downgrade
          your plan anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PricingTableSkeleton />}>
          <PricingTable />
        </Suspense>
      </CardContent>
    </Card>
  );
}

// FAQ component
function FAQ() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardDescription>
          Common questions about OG Images and our service.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Support section component
function SupportSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Need Help?</CardTitle>
        <CardDescription>
          Have questions or need support? We&rsquo;re here to help.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/help">
            <Button variant="outline" className="w-full sm:w-auto">
              View Help Articles
            </Button>
          </Link>
          <Link href="mailto:hello@praveenjuge.com">
            <Button className="w-full sm:w-auto">Contact Support</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <ThemeSettings />
      </Suspense>

      <Suspense fallback={<PricingTableSkeleton />}>
        <PlanAndBilling />
      </Suspense>

      <Suspense fallback={<FAQSkeleton />}>
        <FAQ />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <SupportSection />
      </Suspense>
    </div>
  );
}
