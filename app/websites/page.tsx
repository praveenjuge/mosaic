import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { Plus } from "@mynaui/icons-react";
import { Metadata } from "next";
import { Suspense } from "react";
import { AddWebsite } from "./AddWebsite";
import WebsitesSignedOut from "./WebsitesSignedOut";
import WebsitesTable from "./WebsitesTable";

export const metadata: Metadata = {
  title: "Websites",
  description: "Add, edit or remove websites here.",
  openGraph: {
    images: [getOgImageUrl("websites")],
  },
};

export default function Page() {
  return (
    <>
      <div className="flex items-center justify-between">
        <CardHeader className="p-0">
          <CardTitle>{metadata.title as string}</CardTitle>
          <CardDescription>{metadata.description}</CardDescription>
        </CardHeader>
        <Suspense
          fallback={
            <Button size="sm" disabled>
              <Plus className="mr-1 size-4" stroke={2} />
              Add Website
            </Button>
          }
        >
          <AddWebsite />
        </Suspense>
      </div>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
        <WebsitesSignedOut />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
        <WebsitesTable />
      </Suspense>
    </>
  );
}
