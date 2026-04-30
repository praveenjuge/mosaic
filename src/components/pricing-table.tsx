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
import { authenticatedHomePath } from "@/lib/clerk-auth";
import { SignUpButton } from "@clerk/tanstack-react-start";
import { Check } from "lucide-react";

// ── Pricing Data ────────────────────────────────────────────────────

type PlanType = "free" | "pro" | "pro-yearly";

interface PlanInfo {
  images_display: string;
  websites: string;
  support: string;
}

interface Plan {
  name: string;
  description: string;
  price: string;
  period: string;
  badge: string | null;
  planType: PlanType;
}

const LANDING_PAGE_LIMITS = {
  FREE: 500,
  PRO: 5000,
  PRO_YEARLY: 999999,
} as const;

function formatPlanLimit(limit: number): string {
  return limit >= 999999
    ? "Unlimited OG Images"
    : `${limit.toLocaleString()} OG Images`;
}

const PLANS: Record<PlanType, PlanInfo> = {
  free: {
    images_display: formatPlanLimit(LANDING_PAGE_LIMITS.FREE),
    websites: "Unlimited Websites",
    support: "Community Forum Support",
  },
  pro: {
    images_display: formatPlanLimit(LANDING_PAGE_LIMITS.PRO),
    websites: "Unlimited Websites",
    support: "Priority Email Support",
  },
  "pro-yearly": {
    images_display: formatPlanLimit(LANDING_PAGE_LIMITS.PRO_YEARLY),
    websites: "Unlimited Websites",
    support: "Priority Email Support",
  },
};

const PRICING_PLANS: Plan[] = [
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

// ── Components ──────────────────────────────────────────────────────

function PlanButton({ type }: { type: PlanType }) {
  return (
    <SignUpButton
      fallbackRedirectUrl={authenticatedHomePath}
      forceRedirectUrl={authenticatedHomePath}
    >
      <Button className="w-full">
        {type === "free" ? "Start Free" : "Sign Up"}
      </Button>
    </SignUpButton>
  );
}

function PlanCard({
  name,
  description,
  price,
  period,
  badge,
  planType,
  planInfo,
}: Plan & { planInfo: PlanInfo }) {
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

export default function PricingTable() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PRICING_PLANS.map((plan) => (
        <PlanCard
          key={plan.planType}
          {...plan}
          planInfo={PLANS[plan.planType]}
        />
      ))}
    </div>
  );
}
