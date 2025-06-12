import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { Check } from "@mynaui/icons-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlanButton } from "./plan-button";
import { ModeToggle } from "./theme-toggler";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "You can customize your experience and configure various aspects our service here.",
  openGraph: {
    images: [getOgImageUrl("settings")],
  },
};

const plans = [
  {
    title: "Free",
    description: "For Trying Out",
    price: "$0",
    features: ["500 OG Images", "1 Website", "No Support"],
    type: "free",
  },
  {
    title: "Pro",
    description: "For Individual Use",
    price: "$19",
    features: ["5000 OG Images", "Unlimited Websites", "Priority Email Support"],
    type: "pro",
  },
  {
    title: "Pro Yearly",
    description: "For Larger Websites",
    price: "$199",
    features: [
      "Unlimited OG Images",
      "Unlimited Websites",
      "Priority Email Support",
      "Save $29 vs monthly",
    ],
    type: "pro-yearly",
  },
];

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
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Plan</CardTitle>
          <CardDescription>
            Select the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-2xl font-bold">{plan.price}</div>
                  {plan.price !== "$0" && (
                    <div className="text-sm text-muted-foreground">
                      {plan.type === "pro-yearly" ? "per year" : "per month"}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Suspense
                    fallback={<Skeleton className="h-10 w-full" />}
                  >
                    <PlanButton
                      type={plan.type as
                        | "free"
                        | "pro"
                        | "teams"
                        | "pro-yearly"}
                    />
                  </Suspense>
                </CardFooter>
                {plan.title === "Pro Yearly" && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Best Value
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

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
              <p className="text-sm text-muted-foreground mb-2">
                Learn how to use our service effectively
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help">View Guides</Link>
              </Button>
            </div>
            <div>
              <h4 className="font-medium">Legal</h4>
              <p className="text-sm text-muted-foreground mb-2">
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
