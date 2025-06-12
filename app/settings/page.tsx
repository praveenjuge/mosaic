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
      "Every account can generate up to 500 images for a single website at no cost.",
  },
  {
    question: "Do you offer paid plans or upgrades?",
    answer:
      "Paid tiers with higher limits are in the works. For now everyone enjoys the Free plan.",
  },
  {
    question: "What happens when I hit the limit?",
    answer:
      "New images won't be generated, but your existing ones stay available.",
  },
  {
    question: "Can I change or cancel a plan later?",
    answer:
      "Once paid plans are live you'll be able to upgrade, downgrade or cancel at any time.",
  },
  {
    question: "How do I get help if I run into issues?",
    answer:
      "Reach out via email or our social channels. Priority support will be part of the paid plans.",
  },
  {
    question: "Do you offer discounts or promo codes?",
    answer:
      "Not at the moment, but we may run promotions when paid plans launch.",
  },
  {
    question: "How do you handle privacy and security?",
    answer:
      "We take your privacy and security seriously, implementing industry-standard measures to protect your data. Check our Privacy Policy for details.",
  },
];

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-[45px] w-full"></div>}>
            <ModeToggle />
          </Suspense>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <CardHeader>
        <CardTitle>Choose Your Plan</CardTitle>
        <CardDescription>
          Select the plan that best fits your needs
        </CardDescription>
      </CardHeader>
      <PricingTable />

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Find answers to common questions about our service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Get support and learn more about our service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium">Documentation</h4>
              <p className="text-muted-foreground mb-2 text-sm">
                Learn how to use our service effectively
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help">View Guides</Link>
              </Button>
            </div>
            <div>
              <h4 className="font-medium">Legal</h4>
              <p className="text-muted-foreground mb-2 text-sm">
                Terms of service and privacy policy
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/legal">Legal Pages</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
