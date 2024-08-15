import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getOgImageUrl } from "@/lib/utils";
import { Check, ChevronDown } from "@mynaui/icons-react";
import { Metadata } from "next";
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
    description: "For trying out",
    price: "$0",
    features: ["500 images", "1 website", "500 MB storage", "No support"],
    type: "free",
  },
  {
    title: "Pro",
    description: "For individual use",
    price: "$19",
    features: [
      "5000 images",
      "Unlimited websites",
      "2 GB storage",
      "Email support",
    ],
    type: "pro",
  },
  {
    title: "Teams",
    description: "For small to medium teams",
    price: "$99",
    features: [
      "Unlimited images",
      "Unlimited websites",
      "100 GB storage",
      "Priority email support",
    ],
    type: "teams",
  },
  {
    title: "Enterprise",
    description: "For large organizations",
    price: "Contact us",
    priceSubtext: "Custom pricing and features",
    features: [
      "Unlimited images",
      "Unlimited websites",
      "Unlimited storage",
      "Dedicated account manager",
    ],
    type: "enterprise",
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
            Click on the "Subscription" tab in the left-hand navigation menu.
          </li>
          <li>Under "Your Plan", click on the "Upgrade" button.</li>
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
            Click on the "Subscription" tab in the left-hand navigation menu.
          </li>
          <li>Under "Your Plan", click on the "Cancel Subscription" button.</li>
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
          <li>Click on the "Team" tab in the left-hand navigation menu.</li>
          <li>Click on the "Add Member" button.</li>
          <li>Enter the email address of the team member you want to add.</li>
          <li>Select the role and permissions for the new team member.</li>
          <li>Click "Invite" to send an invitation to the team member.</li>
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
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-4">
        {plans.map((plan, index) => (
          <Card key={index}>
            <CardHeader className="border-b-[0.5px]">
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <div className="mb-1 text-4xl font-bold tracking-tight">
                {plan.price}
              </div>
              <div className="text-sm text-muted-foreground">
                {plan.priceSubtext || "per month"}
              </div>
              <ul className="mt-8 grid w-full gap-2">
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
                  type={plan.type as "free" | "pro" | "teams" | "enterprise"}
                />
              </Suspense>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Suspense>
        <ManageCard />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            If you can't find the answer you're looking for, please don't
            hesitate to reach out to our support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {faqs.map((faq, index) => (
            <Collapsible key={index}>
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between space-x-4 rounded border-[0.5px] pl-4">
                  <h4 className="text-sm font-medium">{faq.question}</h4>
                  <Button variant="ghost" size="icon">
                    <ChevronDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 py-2 text-muted-foreground">
                {faq.answer}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
