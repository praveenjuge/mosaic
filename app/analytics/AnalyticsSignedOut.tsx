import { Button } from "@/components/ui/button";
import { SignedOut } from "@clerk/nextjs";
import { ChartBar, Plus } from "@mynaui/icons-react";
import { Suspense } from "react";
import { AddWebsite } from "../websites/AddWebsite";

export default function AnalyticsSignedOut() {
  return (
    <SignedOut>
      <div className="flex w-full flex-col items-center justify-center rounded border-[0.5px] bg-primary-foreground px-4 py-20 text-center">
        <div className="mx-auto rounded-full border-[0.5px] bg-background p-2">
          <ChartBar className="size-6" />
        </div>
        <h3 className="mb-1 mt-2 text-sm font-medium">
          Add your first website to get started with analytics.
        </h3>
        <p className="mb-4 text-balance text-sm text-muted-foreground">
          When you add a website, you will be able to see detailed analytics
          about OG generation here.
        </p>
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
    </SignedOut>
  );
}
