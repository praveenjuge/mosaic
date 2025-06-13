import FAQComponent from "@/components/faq";
import PricingTable from "@/components/pricing-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ModeToggle } from "./theme-toggler";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "You can customize your experience and configure various aspects our service here.",
  openGraph: {
    images: [getOgImageUrl("settings")],
  },
};

// Loading skeletons
function ThemeToggleSkeleton() {
  return <Skeleton className="h-10 w-32" />;
}

function PricingTableSkeleton() {
  return <Skeleton className="h-64 w-full rounded-lg" />;
}

function FAQSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

// Theme settings component
function ThemeSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose how you want the application to look.
        </CardDescription>
        <CardAction>
          <Suspense fallback={<ThemeToggleSkeleton />}>
            <ModeToggle />
          </Suspense>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

// Plan and billing component
function PlanAndBilling() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan & Billing</CardTitle>
        <CardDescription>
          Manage your subscription and billing preferences. Upgrade or downgrade
          your plan anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PricingTableSkeleton />}>
          <PricingTable />
        </Suspense>
      </CardContent>
    </Card>
  );
}

// Support section component
function SupportSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Need Help?</CardTitle>
        <CardDescription>
          Have questions or need support? We&rsquo;re here to help.
        </CardDescription>
        <CardAction>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/help">
              <Button variant="outline" className="w-full sm:w-auto">
                View Help Articles
              </Button>
            </Link>
            <Link href="mailto:hello@praveenjuge.com">
              <Button className="w-full sm:w-auto">Contact Support</Button>
            </Link>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
        </CardDescription>
      </CardHeader>

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <ThemeSettings />
      </Suspense>

      <Suspense fallback={<PricingTableSkeleton />}>
        <PlanAndBilling />
      </Suspense>

      <Suspense fallback={<FAQSkeleton />}>
        <FAQComponent />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <SupportSection />
      </Suspense>
    </div>
  );
}
