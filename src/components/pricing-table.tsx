import { SignUpLink } from "@/components/auth/auth-links";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

const PLANS: Record<PlanType, PlanInfo> = {
  free: {
    images_display: "Automatic shared OG cache",
    websites: "Unlimited websites",
    support: "Community support",
  },
  pro: {
    images_display: "Automatic shared OG cache",
    websites: "Unlimited websites",
    support: "Priority email support",
  },
  "pro-yearly": {
    images_display: "Automatic shared OG cache",
    websites: "Unlimited websites",
    support: "Priority email support",
  },
};

const PRICING_PLANS: Plan[] = [
  {
    name: "Free",
    description: "For personal sites and side projects.",
    price: "$0",
    period: "",
    badge: null,
    planType: "free",
  },
  {
    name: "Pro",
    description: "For growing teams and products.",
    price: "$19",
    period: "/month",
    badge: "Popular",
    planType: "pro",
  },
  {
    name: "Pro Yearly",
    description: "Everything in Pro, billed yearly.",
    price: "$199",
    period: "/year",
    badge: "Save $29",
    planType: "pro-yearly",
  },
];

// ── Components ──────────────────────────────────────────────────────

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
  const featured = planType === "pro";

  return (
    <div
      className={cn(
        "bg-card flex flex-col rounded-2xl border p-6 shadow-xs",
        featured && "ring-foreground border-transparent ring-2",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{name}</h3>
        {badge ? (
          <Badge variant={featured ? "default" : "secondary"}>{badge}</Badge>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{price}</span>
        <span className="text-muted-foreground text-sm">{period}</span>
      </p>
      <SignUpLink
        variant={featured ? "default" : "outline"}
        className="mt-6 w-full"
      >
        {planType === "free" ? "Start for free" : "Get started"}
      </SignUpLink>
      <ul className="mt-6 space-y-3 border-t pt-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <Check className="text-brand size-4 shrink-0" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PricingTable() {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
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
