"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCustomerPortalUrl } from "@/lib/lemon";
import { SignedIn } from "@clerk/nextjs";

export function ManageCard() {
  return (
    <SignedIn>
      <Card>
        <CardHeader className="flex justify-between gap-2 md:flex-row">
          <div className="flex max-w-3xl flex-col gap-2">
            <CardTitle>Invoice History & Manage Plan</CardTitle>
            <CardDescription>
              Find the details of your previous invoices or to cancel your
              current subscription. If you have any questions regarding your
              invoices, please contact our support team.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              const url = await getCustomerPortalUrl();
              if (typeof url === "string") {
                window.location.href = url;
              }
            }}
          >
            Manage Plan
          </Button>
        </CardHeader>
      </Card>
    </SignedIn>
  );
}
