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
import { website_url } from "@/lib/constants";
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

// Stat card components
function ImagesStatCard({
  count,
  limit,
  plan,
}: {
  count: number;
  limit: number | null;
  plan: "free" | "pro" | "pro-yearly";
}) {
  const limitText = limit ? `${limit.toLocaleString()}` : "∞";
  return (
    <Card>
      <CardHeader className="px-4">
        <CardTitle>
          {count.toLocaleString()}/{limitText}
        </CardTitle>
        <CardDescription>OG Images</CardDescription>
      </CardHeader>
    </Card>
  );
}

// Upgrade button component
function UpgradeButton({
  type,
  productId,
  label,
  dashboardStats,
  createCheckout,
}: {
  type: "free" | "pro" | "pro-yearly";
  productId: string;
  label?: string;
  dashboardStats: DashboardStats;
  createCheckout: (args: {
    productIds: string[];
    successUrl: string;
    origin: string;
  }) => Promise<unknown>;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isActive = dashboardStats.is_active;
  const currentPlan = dashboardStats.plan;

  const handleUpgrade = async () => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const result = await createCheckout({
        productIds: [productId],
        successUrl: `${window.location.origin}/`,
        origin: window.location.origin,
      });
      if (result && typeof result === "object" && "url" in result) {
        window.location.href = result.url as string;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderButton = () => {
    if (type === "free") {
      const planName = isActive
        ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
        : "Free";
      return (
        <Button variant="outline" size="sm" disabled>
          You are on {planName} Plan {isActive ? "🎉" : ""}
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
      const otherPlanName = type === "pro" ? "Pro Yearly" : "Pro";
      return (
        <Button variant="outline" size="sm" disabled>
          You are on {otherPlanName} Plan 🎉
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

    const upgradeText =
      label || (type === "pro" ? "Upgrade to Pro" : "Upgrade to Pro Yearly");

    return (
      <Button size="sm" onClick={handleUpgrade} disabled={isLoading}>
        {isLoading ? "Loading..." : upgradeText}
      </Button>
    );
  };

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
        <SignedIn>{renderButton()}</SignedIn>
      </ClerkLoaded>
    </>
  );
}

// Loading skeleton
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

// Empty state for screenshots
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

// Website table row component
function WebsiteRow({
  website,
  screenshotCount,
}: {
  website: DashboardStats["websites"][number];
  screenshotCount: number;
}) {
  return (
    <TableRow className="items-center">
      <TableCell>
        <div className="flex items-center gap-2">
          <Suspense fallback={<Skeleton className="size-3.5 rounded-sm" />}>
            <Image
              src={`https://www.google.com/s2/favicons?domain=https://${website.url_base}&sz=64`}
              alt="Favicon"
              className="size-3.5"
              width={14}
              height={14}
            />
          </Suspense>
          <a
            href={`https://${website.url_base}`}
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
            {`${website_url}use?url=https://${website.url_base}`}
          </span>
          <Suspense fallback={<Skeleton className="size-4" />}>
            <CopyButton
              text={`${website_url}use?url=https://${website.url_base}`}
            />
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
            {/* Limit Alert */}
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

            {/* Stats Section */}
            <div className="flex flex-col gap-1.5">
              <CardHeader className="p-0">
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="px-4">
                    <CardTitle>
                      {dashboardStats.total_websites.toLocaleString()}
                    </CardTitle>
                    <CardDescription>Websites</CardDescription>
                  </CardHeader>
                </Card>
                <ImagesStatCard
                  count={dashboardStats.total_images}
                  limit={dashboardStats.images_limit}
                  plan={dashboardStats.plan}
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
                              ? process.env
                                  .NEXT_PUBLIC_POLAR_PREMIUM_YEARLY_PRODUCT_ID ||
                                ""
                              : process.env
                                  .NEXT_PUBLIC_POLAR_PREMIUM_MONTHLY_PRODUCT_ID ||
                                ""
                          }
                          dashboardStats={dashboardStats}
                          createCheckout={createCheckout}
                        />
                      ) : (
                        <div className="flex gap-2">
                          <UpgradeButton
                            type="pro"
                            label="Monthly $19"
                            productId={
                              process.env
                                .NEXT_PUBLIC_POLAR_PREMIUM_MONTHLY_PRODUCT_ID ||
                              ""
                            }
                            dashboardStats={dashboardStats}
                            createCheckout={createCheckout}
                          />
                          <UpgradeButton
                            type="pro-yearly"
                            label="Yearly $199"
                            productId={
                              process.env
                                .NEXT_PUBLIC_POLAR_PREMIUM_YEARLY_PRODUCT_ID ||
                              ""
                            }
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

            {/* Websites Section */}
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

            {/* Latest Screenshots Section */}
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
                      {dashboardStats.latest_screenshots.map((item) => {
                        const pageUrl = item.page_url.replace(/\\+$/, "");
                        const displayUrl = pageUrl.replace(/^https?:\/\//, "");

                        return (
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
                                  alt={pageUrl || "Screenshot"}
                                  className="h-6 w-12 shrink-0 rounded border-[0.5px] bg-cover bg-center object-cover"
                                  width={56}
                                  height={24}
                                />
                              </Link>
                            </TableCell>
                            <TableCell>
                              {pageUrl ? (
                                <a
                                  href={pageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary max-w-xs truncate font-medium hover:underline"
                                >
                                  {displayUrl}
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
                                {item.generated_at
                                  ? new Date(item.generated_at).toLocaleString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                        second: "numeric",
                                        hour12: true,
                                      },
                                    )
                                  : "Never refreshed"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
