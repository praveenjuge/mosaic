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
    question: "How do I upgrade my plan?",
    answer: (
      <>
        <p>To upgrade your plan, follow these steps:</p>
        <ol className="list-inside list-decimal">
          <li>
            Click on the &quot;Subscription&quot; tab in the left-hand
            navigation menu.
          </li>
          <li>
            Under &quot;Your Plan&quot;, click on the &quot;Upgrade&quot;
            button.
          </li>
          <li>
            Select the new plan you want to upgrade to and follow the prompts to
            complete the upgrade process.
          </li>
        </ol>
      </>
    ),
  },
  {
    question: "How do I cancel my subscription?",
    answer: (
      <>
        <p>To cancel your subscription, follow these steps:</p>
        <ol className="list-inside list-decimal">
          <li>
            Click on the &quot;Subscription&quot; tab in the left-hand
            navigation menu.
          </li>
          <li>
            Under &quot;Your Plan&quot;, click on the &quot;Cancel
            Subscription&quot; button.
          </li>
          <li>Follow the prompts to confirm the cancellation.</li>
        </ol>
      </>
    ),
  },
  {
    question: "How do I add a team member?",
    answer: (
      <>
        <p>To add a team member, follow these steps:</p>
        <ol className="list-inside list-decimal">
          <li>
            Click on the &quot;Team&quot; tab in the left-hand navigation menu.
          </li>
          <li>Click on the &quot;Add Member&quot; button.</li>
          <li>Enter the email address of the team member you want to add.</li>
          <li>Select the role and permissions for the new team member.</li>
          <li>
            Click &quot;Invite&quot; to send an invitation to the team member.
          </li>
        </ol>
      </>
    ),
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
          <Card key={index}>
            <CardHeader className="flex-row justify-between space-y-0 border-b-[0.5px]">
              <CardTitle>{plan.title}</CardTitle>
              <Badge variant="outline">{plan.description}</Badge>
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
            don&apos;t checkout our{" "}
            <Link href="/help" className="underline">
              help articles
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion
            type="single"
            collapsible
            className="grid w-full gap-2 text-sm"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={faq.question}
                className="rounded border-[0.5px] px-4"
              >
                <AccordionTrigger>{faq.question}</AccordionTrigger>
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
