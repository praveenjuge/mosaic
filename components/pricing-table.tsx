"use client";

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
import { api } from "@/convex/_generated/api";
import type { PlanInfo } from "@/convex/stats";
import { SignUpButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Check } from "lucide-react";

type PlanType = "free" | "pro" | "pro-yearly";

interface Plan {
  name: string;
  description: string;
  price: string;
  period: string;
  badge: string | null;
  planType: PlanType;
}

const plans: Plan[] = [
  {
    name: "Free",
    description: "Perfect for Getting Started",
    price: "$0",
    period: "",
    badge: null,
    planType: "free",
  },
  {
    name: "Pro",
    description: "For Growing Teams",
    price: "$19",
    period: "/month",
    badge: "Popular",
    planType: "pro",
  },
  {
    name: "Pro Yearly",
    description: "Best Value - Save $29",
    price: "$199",
    period: "/year",
    badge: "Save $29/year",
    planType: "pro-yearly",
  },
];

interface PlanButtonProps {
  type: PlanType;
}

function PlanButton({ type }: PlanButtonProps) {
  return (
    <SignUpButton mode="modal" oauthFlow="popup">
      <Button className="w-full">
        {type === "free" ? "Start Free" : "Sign Up"}
      </Button>
    </SignUpButton>
  );
}

interface PlanCardProps {
  name: string;
  description: string;
  price: string;
  period: string;
  badge: string | null;
  planType: PlanType;
  planInfo: PlanInfo;
}

function PlanCard({
  name,
  description,
  price,
  period,
  badge,
  planType,
  planInfo,
}: PlanCardProps) {
  const features = [
    planInfo.images_display,
    planInfo.websites,
    planInfo.support,
  ];

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
          {features.map((feature) => (
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

function getDefaultPlanInfo(): PlanInfo {
  return {
    images: 0,
    images_display: "Loading...",
    websites: "Loading...",
    support: "Loading...",
  };
}

export default function PricingTable() {
  const planInfo = useQuery(api.stats.getPlanInfo);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.planType}
          name={plan.name}
          description={plan.description}
          price={plan.price}
          period={plan.period}
          badge={plan.badge}
          planType={plan.planType}
          planInfo={planInfo?.[plan.planType] ?? getDefaultPlanInfo()}
        />
      ))}
    </div>
  );
}
