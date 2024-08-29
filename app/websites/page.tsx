import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOgImageUrl } from "@/lib/utils";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Earth, Plus } from "@mynaui/icons-react";
import { Metadata } from "next";
import { Suspense } from "react";
import { AddWebsite } from "./AddWebsite";
import WebsitesTable from "./WebsitesTable";

export const metadata: Metadata = {
  title: "Websites",
  description: "Add, edit or remove websites here.",
  openGraph: {
    images: [getOgImageUrl("websites")],
  },
};

export default async function Page() {
  const userData = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaData: any = await userData?.sessionClaims?.public_metadata;

  const preventSubmission = metaData?.websites_used > metaData?.websites_limit;

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
          <AddWebsite preventSubmission={preventSubmission} />
        </Suspense>
      </div>
      <SignedOut>
        <div className="flex w-full flex-col items-center justify-center rounded border-[0.5px] bg-primary-foreground px-4 py-20 text-center">
          <div className="mx-auto rounded-full border-[0.5px] bg-background p-2">
            <Earth className="size-6" />
          </div>
          <h3 className="mb-1 mt-2 text-sm font-medium">
            Add your websites here
          </h3>
          <p className="mb-4 text-balance text-sm text-muted-foreground">
            When you add a website you will get a special URL to get your OG
            Images for that website.
          </p>
        </div>
      </SignedOut>
      <SignedIn>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <WebsitesTable />
        </Suspense>
      </SignedIn>
    </>
  );
}
