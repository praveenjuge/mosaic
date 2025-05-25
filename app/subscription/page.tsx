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
  CardAction,
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
import { ManageCard } from "./manage-card";
import { PlanButton } from "./plan-button";

export const metadata: Metadata = {
  title: "Subscription",
  description: "Manage your billing and invoices here.",
  openGraph: {
    images: [getOgImageUrl("subscription")],
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
  // {
  //   title: "Teams",
  //   description: "For small to medium teams",
  //   price: "$99",
  //   features: [
  //     "Unlimited images",
  //     "Unlimited websites",
  //     "Priority email support",
  //   ],
  //   type: "teams",
  // },
  {
    title: "Pro Plus",
    description: "For Larger Websites",
    price: "Custom",
    features: [
      "Unlimited Images",
      "Unlimited Websites",
      "Dedicated Account Manager",
    ],
    type: "pro-plus",
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
      "Free Plan: Get 500 images for 1 website with no support at $0 per month. Pro Plan: Enjoy 5,000 images for unlimited websites with priority email support at $19 per month. Pro Plus Plan: Receive unlimited images for unlimited websites with a dedicated account manager. Pricing is custom—please contact us for details.",
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
      "We recommend the Pro plan for most teams. It offers ample resources, supports unlimited websites, and includes priority email support. For larger teams or websites, the Pro Plus plan might be more suitable.",
  },
  {
    question: "How do I pick the right features?",
    answer:
      "Consider the number of images you need, the number of websites you manage, and the level of support you want. The Free plan is great for trying out the service, the Pro plan offers more resources and priority support, and the Pro Plus plan provides unlimited images and a dedicated account manager.",
  },
  {
    question: "Can I pay annually or get non-profit/student discounts?",
    answer:
      "Currently, we don't offer annual payment options or specific discounts for non-profits or students.",
  },
  {
    question: "What payment methods do you accept, and can I change them?",
    answer:
      "We accept major credit cards and PayPal through Gumroad. You can update your payment method anytime in your account settings.",
  },
  {
    question: "How is payment processed, and can I use promo codes?",
    answer:
      "Payments are securely processed through Gumroad. If you have a promo code, you can apply it during the checkout process.",
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
      "The Free plan does not include support. The Pro plan includes Priority Email Support, meaning your inquiries are addressed promptly. The Pro Plus plan offers a dedicated account manager for personalized assistance.",
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
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan, index) => (
          <Card key={index} className="gap-0">
            <CardHeader className="flex-row justify-between">
              <CardTitle>{plan.title}</CardTitle>
              <CardAction className="ml-auto">
                <Badge variant="outline">{plan.description}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col py-6">
              <div className="flex items-center gap-2">
                <div className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
              <ul className="mt-6 grid w-full gap-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <Check className="size-5 text-primary" stroke={2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Suspense
                fallback={
                  <Button variant="outline" className="w-full" disabled>
                    Loading...
                  </Button>
                }
              >
                <PlanButton
                  type={plan.type as "free" | "pro" | "teams" | "pro-plus"}
                />
              </Suspense>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
        <ManageCard />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            If you can&apos;t find the answer you&apos;re looking for, please
            check out our{" "}
            <Link href="/help" className="underline">
              help articles
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-sm">
          <Accordion type="single">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={faq.question} className="px-6">
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
