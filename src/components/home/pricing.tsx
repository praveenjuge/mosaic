import { SignUpLink } from "@/components/auth/auth-links";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "vadivam-react";
import { SectionHeading } from "./section-heading";

type Plan = {
  name: string;
  description: string;
  price: string;
  period: string;
  badge?: string;
  /** Outlined with the primary call to action. */
  featured?: boolean;
  cta: string;
  support: string;
};

const SHARED_FEATURES = ["Automatic shared OG cache", "Unlimited websites"];

const PLANS: Plan[] = [
  {
    name: "Free",
    description: "For personal sites and side projects.",
    price: "$0",
    period: "",
    cta: "Start for free",
    support: "Community support",
  },
  {
    name: "Pro",
    description: "For growing teams and products.",
    price: "$19",
    period: "/month",
    badge: "Popular",
    featured: true,
    cta: "Get started",
    support: "Priority email support",
  },
  {
    name: "Pro Yearly",
    description: "Everything in Pro, billed yearly.",
    price: "$199",
    period: "/year",
    badge: "Save $29",
    cta: "Get started",
    support: "Priority email support",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const { featured } = plan;
  return (
    <div
      className={cn(
        "bg-card flex flex-col rounded-2xl border p-6 shadow-xs",
        featured && "ring-foreground border-transparent ring-2",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{plan.name}</h3>
        {plan.badge ? (
          <Badge variant={featured ? "default" : "secondary"}>
            {plan.badge}
          </Badge>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">
          {plan.price}
        </span>
        <span className="text-muted-foreground text-sm">{plan.period}</span>
      </p>
      <SignUpLink
        variant={featured ? "default" : "outline"}
        className="mt-6 w-full"
      >
        {plan.cta}
      </SignUpLink>
      <ul className="mt-6 space-y-3 border-t pt-6">
        {[...SHARED_FEATURES, plan.support].map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <Check className="text-brand size-4 shrink-0" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="flex flex-col gap-12">
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        description="Start for free and upgrade when you need more. No hidden fees, cancel anytime."
      />
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>
    </section>
  );
}
