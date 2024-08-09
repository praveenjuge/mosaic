import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignedIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ExternalLink } from "@mynaui/icons-react";
import Link from "next/link";
import { Suspense } from "react";

export async function ManageCard() {
  const userData = await auth();
  const metaData: any = await userData?.sessionClaims?.public_metadata;
  const subscriptionId: any = metaData?.plan?.subscription_id

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
          <Suspense fallback={<Button variant="outline" disabled></Button>}>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default" })}
              href={subscriptionId ? `https://app.gumroad.com/subscriptions/${subscriptionId}/manage` : ""}
            >
              Manage Plan
              <ExternalLink className="ml-2 size-4" strokeWidth={2} />
            </Link>
          </Suspense>
        </CardHeader>
      </Card>
    </SignedIn>
  );
}