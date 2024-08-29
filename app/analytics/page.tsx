import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";
import { Suspense } from "react";
import AnalyticsSignedIn from "./AnalyticsSignedIn";
import AnalyticsSignedOut from "./AnalyticsSignedOut";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View your logs and analytics here.",
  openGraph: {
    images: [getOgImageUrl("analytics")],
  },
};

export default function Page() {
  return (
    <>
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
        <AnalyticsSignedOut />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
        <AnalyticsSignedIn />
      </Suspense>
    </>
  );
}
