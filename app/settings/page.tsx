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
    features: ["500 Images", "1 Website", "No Support"],
    type: "free",
  },
  {
    title: "Pro",
    description: "For Individual Use",
    price: "$19",
    features: ["5000 Images", "Unlimited Websites", "Priority Email Support"],
    type: "pro",
  },
  {
    title: "Pro Yearly",
    description: "For Larger Websites",
    price: "$199",
    features: [
      "Unlimited Images",
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
      "An OG Image, or Open Graph Image, is a preview image that appears when you share a link to your website on social media platforms. It enhances your shared content by displaying a visual representation of your webpage.",
  },
  {
    question: "What's included in each plan?",
    answer:
      "Free Plan: Get 500 images for 1 website with no support at $0 per month. Pro Plan: Enjoy 5,000 images for unlimited websites with priority email support at $19 per month. Pro Yearly Plan: Receive unlimited images for unlimited websites with priority email support at $199 per year (save $29 vs monthly).",
  },
  {
    question: "How many free OG Images do I get?",
    answer: "With our Free plan, you receive up to 500 OG Images.",
  },
  {
    question: "Why upgrade to Mosaic Pro?",
    answer:
      "Upgrading to Mosaic Pro gives you more resources: 5,000 images per month, support for unlimited websites, and priority email support. It's ideal if you need more than what the Free plan offers.",
  },
  {
    question: "What happens if I hit the free plan limit?",
    answer:
      "If you reach your Free plan limit, no new images will be generated, but your existing OG Images will remain available. You can upgrade to a higher plan to continue generating new images.",
  },
  {
    question: "Can I switch or cancel plans?",
    answer:
      "Yes, you can switch between plans or cancel your subscription at any time.",
  },
  {
    question: "Is there a free trial or refund option?",
    answer:
      "We don't offer a free trial since our Free plan lets you try out our services at no cost. If you're unsatisfied within the first 30 days of your Pro subscription, you may be eligible for a refund as outlined in our Refund Policy.",
  },
  {
    question: "Are there any hidden fees or penalties?",
    answer:
      "No, there are no hidden fees or penalties. All our pricing is transparent.",
  },
  {
    question: "Which plan is best for my team?",
    answer:
      "We recommend the Pro plan for most teams. It offers ample resources, supports unlimited websites, and includes priority email support. For larger teams or websites with high usage, the Pro Yearly plan might be more suitable and cost-effective.",
  },
  {
    question: "How do I pick the right features?",
    answer:
      "Consider the number of images you need, the number of websites you manage, and the level of support you want. The Free plan is great for trying out the service, the Pro plan offers more resources and priority support, and the Pro Yearly plan provides unlimited images with better value for long-term usage.",
  },
  {
    question: "Can I pay annually or get non-profit/student discounts?",
    answer:
      "Yes! We now offer a Pro Yearly plan at $199 per year, which saves you $29 compared to paying monthly. We don't currently offer specific discounts for non-profits or students.",
  },
  {
    question: "What payment methods do you accept, and can I change them?",
    answer:
      "We accept major credit cards and PayPal. You can update your payment method anytime in your account settings.",
  },
  {
    question: "How is payment processed, and can I use promo codes?",
    answer:
      "Payments are securely processed through our payment provider. Promo codes may be available during special promotions.",
  },
  {
    question: "What happens if my payment fails?",
    answer:
      "If your payment fails, we'll notify you to update your payment information. Your account may be temporarily in free plan until the payment issue is resolved.",
  },
  {
    question: "Do you offer price localization?",
    answer:
      "No, all our prices are listed in USD, and we do not offer price localization at this time.",
  },
  {
    question: "Do all plans include support, and what is Priority Support?",
    answer:
      "The Free plan does not include support. Both Pro and Pro Yearly plans include Priority Email Support, meaning your inquiries are addressed promptly by our support team.",
  },
  {
    question: "How fast is support response?",
    answer:
      "For plans with support, we aim to respond to inquiries as quickly as possible, typically within 24 hours on business days.",
  },
  {
    question: "Is onboarding available for new users?",
    answer:
      "While we don't offer formal onboarding sessions, our platform is user-friendly, and our support team is ready to assist with any questions you may have.",
  },
  {
    question: "How do you handle privacy and security?",
    answer:
      "We take your privacy and security seriously, implementing industry-standard measures to protect your data. Please refer to our Privacy Policy for more details.",
  },
];

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <div className="grid w-full max-w-4xl gap-8 pb-4">
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
      </div>
    </>
  );
}
