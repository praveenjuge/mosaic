"use client";

import { CopyButton } from "@/components/copy-button";
import WelcomeEmptyState from "@/components/home/WelcomeEmptyState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddWebsite from "@/components/websites/AddWebsite";
import { WebsiteActions } from "@/components/websites/WebsiteActions";
import { WebsiteInfoModal } from "@/components/websites/WebsiteInfoModal";
import { api } from "@/convex/_generated/api";
import type { DashboardStats } from "@/convex/stats";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignUpButton,
} from "@clerk/nextjs";
import { CustomerPortalLink } from "@convex-dev/polar/react";
import {
  Authenticated,
  Unauthenticated,
  useAction,
  useQuery,
} from "convex/react";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";

interface ImagesStatCardProps {
  countDisplay: string;
  limitDisplay: string;
}

function ImagesStatCard({ countDisplay, limitDisplay }: ImagesStatCardProps) {
  return (
    <Card>
      <CardHeader className="px-4">
        <CardTitle>
          {countDisplay}/{limitDisplay}
        </CardTitle>
        <CardDescription>OG Images</CardDescription>
      </CardHeader>
    </Card>
  );
}

type PlanType = "free" | "pro" | "pro-yearly";

interface UpgradeButtonProps {
  type: PlanType;
  productId: string;
  label?: string;
  dashboardStats: DashboardStats;
  createCheckout: (args: {
    productIds: string[];
    successUrl: string;
    origin: string;
  }) => Promise<unknown>;
}

function UpgradeButton({
  type,
  productId,
  label,
  dashboardStats,
  createCheckout,
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isActive = dashboardStats.is_active;
  const currentPlan = dashboardStats.plan;

  function handleUpgrade() {
    if (!productId) return;

    setIsLoading(true);
    createCheckout({
      productIds: [productId],
      successUrl: `${window.location.origin}/`,
      origin: window.location.origin,
    })
      .then((result) => {
        if (result && typeof result === "object" && "url" in result) {
          window.location.href = result.url as string;
        }
      })
      .catch((error) => {
        console.error("Checkout error:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function getSignedInButton() {
    if (type === "free") {
      return (
        <Button variant="outline" size="sm" disabled>
          You are on {dashboardStats.plan_display_name} {isActive ? "🎉" : ""}
        </Button>
      );
    }

    if (isActive && currentPlan === type) {
      return (
        <CustomerPortalLink polarApi={api.billing}>
          <Button size="sm">Manage Subscription 🎉</Button>
        </CustomerPortalLink>
      );
    }

    if (isActive) {
      return (
        <Button variant="outline" size="sm" disabled>
          You are on {dashboardStats.plan_display_name} Plan 🎉
        </Button>
      );
    }

    if (!productId) {
      return (
        <Button variant="outline" size="sm" disabled>
          Invalid plan
        </Button>
      );
    }

    const buttonText =
      label || (type === "pro" ? "Upgrade to Pro" : "Upgrade to Pro Yearly");

    return (
      <Button size="sm" onClick={handleUpgrade} disabled={isLoading}>
        {isLoading ? "Loading..." : buttonText}
      </Button>
    );
  }

  return (
    <>
      <ClerkLoading>
        <Button size="sm" variant="outline" disabled>
          Loading...
        </Button>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <SignUpButton mode="modal" oauthFlow="popup">
            <Button size="sm">
              {type === "free" ? "Start Free" : "Sign Up"}
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>{getSignedInButton()}</SignedIn>
      </ClerkLoaded>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-4.5 w-16" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-3 w-20" />
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ScreenshotsEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No OG Images found</CardTitle>
        <CardDescription>
          OG Images will appear here once you visit pages on your website.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

interface WebsiteRowProps {
  website: DashboardStats["websites"][number];
  screenshotCount: number;
}

function WebsiteRow({ website, screenshotCount }: WebsiteRowProps) {
  return (
    <TableRow className="items-center">
      <TableCell>
        <div className="flex items-center gap-2">
          <Suspense fallback={<Skeleton className="size-3.5 rounded-sm" />}>
            <Image
              src={website.favicon_url}
              alt="Favicon"
              className="size-3.5"
              width={14}
              height={14}
            />
          </Suspense>
          <a
            href={website.full_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary max-w-xs truncate font-medium"
          >
            {website.url_base}
          </a>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="max-w-lg items-center truncate font-medium">
            {website.og_image_usage_url}
          </span>
          <Suspense fallback={<Skeleton className="size-4" />}>
            <CopyButton text={website.og_image_usage_url} />
          </Suspense>
        </div>
      </TableCell>
      <TableCell className="py-0">
        {screenshotCount === 0 ? (
          <Suspense fallback={<Skeleton className="h-4 w-16" />}>
            <WebsiteInfoModal websiteUrl={website.url_base} />
          </Suspense>
        ) : (
          screenshotCount
        )}
      </TableCell>
      <TableCell className="flex items-center p-0.5">
        <Suspense fallback={<Skeleton className="h-8 w-16" />}>
          <WebsiteActions
            websiteId={website._id}
            currentUrl={website.url_base}
          />
        </Suspense>
      </TableCell>
    </TableRow>
  );
}

export default function SignedInDashboard() {
  const dashboardStats = useQuery(api.stats.getUserDashboardStats);
  const createCheckout = useAction(api.billing.createCheckoutLink);

  return (
    <>
      <Unauthenticated>
        <div className="text-muted-foreground">
          Please sign in to view your dashboard.
        </div>
      </Unauthenticated>
      <Authenticated>
        {dashboardStats === undefined ? (
          <DashboardSkeleton />
        ) : !dashboardStats.total_websites ? (
          <WelcomeEmptyState />
        ) : (
          <div className="flex flex-col gap-10">
            {dashboardStats.plan === "free" &&
              dashboardStats.has_exceeded_limit && (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertTitle>Free Plan Limit Exceeded</AlertTitle>
                  <AlertDescription>
                    You've reached the limit of {dashboardStats.images_limit} OG
                    images. Upgrade to continue generating images.
                  </AlertDescription>
                </Alert>
              )}

            <div className="flex flex-col gap-1.5">
              <CardHeader className="p-0">
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="px-4">
                    <CardTitle>
                      {dashboardStats.total_websites_display}
                    </CardTitle>
                    <CardDescription>Websites</CardDescription>
                  </CardHeader>
                </Card>
                <ImagesStatCard
                  countDisplay={dashboardStats.total_images_display}
                  limitDisplay={dashboardStats.images_limit_display}
                />
                <Card className="md:col-span-2">
                  <CardHeader className="items-center px-4">
                    <CardTitle>{dashboardStats.plan_display_name}</CardTitle>
                    <CardDescription>
                      {dashboardStats.is_active
                        ? "Your plan is active"
                        : "Upgrade to unlock more features"}
                    </CardDescription>
                    <CardAction>
                      {dashboardStats.is_active ? (
                        <UpgradeButton
                          type={dashboardStats.plan}
                          productId={
                            dashboardStats.plan === "pro-yearly"
                              ? process.env.NEXT_PUBLIC_POLAR_PREMIUM_YEARLY_PRODUCT_ID || ""
                              : process.env.NEXT_PUBLIC_POLAR_PREMIUM_MONTHLY_PRODUCT_ID || ""
                          }
                          dashboardStats={dashboardStats}
                          createCheckout={createCheckout}
                        />
                      ) : (
                        <div className="flex gap-2">
                          <UpgradeButton
                            type="pro"
                            label="Monthly $19"
                            productId={process.env.NEXT_PUBLIC_POLAR_PREMIUM_MONTHLY_PRODUCT_ID || ""}
                            dashboardStats={dashboardStats}
                            createCheckout={createCheckout}
                          />
                          <UpgradeButton
                            type="pro-yearly"
                            label="Yearly $199"
                            productId={process.env.NEXT_PUBLIC_POLAR_PREMIUM_YEARLY_PRODUCT_ID || ""}
                            dashboardStats={dashboardStats}
                            createCheckout={createCheckout}
                          />
                        </div>
                      )}
                    </CardAction>
                  </CardHeader>
                </Card>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <CardHeader className="flex items-center justify-between p-0">
                <CardTitle>Websites</CardTitle>
                <AddWebsite />
              </CardHeader>
              <Card className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Website</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>OG Images</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardStats.websites.map((website) => (
                      <WebsiteRow
                        key={website._id}
                        website={website}
                        screenshotCount={
                          dashboardStats.screenshot_counts[website._id] ?? 0
                        }
                      />
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <div className="flex flex-col gap-1.5">
              <CardHeader className="p-0">
                <CardTitle>Latest OG Images</CardTitle>
              </CardHeader>
              {dashboardStats.latest_screenshots.length === 0 ? (
                <ScreenshotsEmpty />
              ) : (
                <Card className="p-0">
                  <Table>
                    <TableBody>
                      {dashboardStats.latest_screenshots.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-0">
                            <Link
                              target="_blank"
                              rel="noopener noreferrer"
                              href={item.screenshot_url}
                              className="block w-12 shrink-0"
                            >
                              <img
                                src={item.screenshot_url}
                                alt={item.page_url || "Screenshot"}
                                className="h-6 w-12 shrink-0 rounded border-[0.5px] bg-cover bg-center object-cover"
                                width={56}
                                height={24}
                              />
                            </Link>
                          </TableCell>
                          <TableCell>
                            {item.page_url ? (
                              <a
                                href={item.page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary max-w-xs truncate font-medium hover:underline"
                              >
                                {item.display_url}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">
                                Unknown page
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">
                              {item.website_name ?? "Unknown website"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-sm">
                              {item.formatted_date}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </div>
        )}
      </Authenticated>
    </>
  );
}
