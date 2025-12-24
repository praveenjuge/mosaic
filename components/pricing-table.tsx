"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { SignUpButton } from "@clerk/nextjs";

// Define plan features
const planFeatures: Record<"free" | "pro" | "pro-yearly", string[]> = {
  free: ["500 OG Images", "Unlimited Websites", "Community Forum Support"],
  pro: ["5,000 OG Images", "Unlimited Websites", "Priority Email Support"],
  "pro-yearly": [
    "Unlimited OG Images",
    "Unlimited Websites",
    "Priority Email Support",
  ],
};

// Static pricing data
const plans = [
  {
    key: "free",
    name: "Free",
    description: "Perfect for Getting Started",
    price: "$0",
    period: "",
    badge: null,
    planType: "free" as const,
  },
  {
    key: "pro",
    name: "Pro",
    description: "For Growing Teams",
    price: "$19",
    period: "/month",
    badge: "Popular",
    planType: "pro" as const,
  },
  {
    key: "pro-yearly",
    name: "Pro Yearly",
    description: "Best Value - Save $29",
    price: "$199",
    period: "/year",
    badge: "Save $29/year",
    planType: "pro-yearly" as const,
  },
];

// Plan button component
function PlanButton({ type }: { type: "free" | "pro" | "pro-yearly" }) {
  return (
    <SignUpButton mode="modal" oauthFlow="popup">
      <Button className="w-full">
        {type === "free" ? "Start Free" : "Sign Up"}
      </Button>
    </SignUpButton>
  );
}

// Individual plan card component
function PlanCard({
  name,
  description,
  price,
  period,
  badge,
  planType,
}: {
  name: string;
  description: string;
  price: string;
  period: string;
  badge: string | null;
  planType: "free" | "pro" | "pro-yearly";
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-muted-foreground ml-1">{period}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {planFeatures[planType]?.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="text-primary size-4 stroke-2" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <PlanButton type={planType} />
      </CardFooter>
    </Card>
  );
}

// Main pricing table component
export default function PricingTable() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.key}
          name={plan.name}
          description={plan.description}
          price={plan.price}
          period={plan.period}
          badge={plan.badge}
          planType={plan.planType}
        />
      ))}
    </div>
  );
}
