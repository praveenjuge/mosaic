import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "@mynaui/icons-react";
import { Suspense } from "react";

interface ConfirmationPageProps {
  searchParams: {
    checkout_id?: string;
  };
}

function ConfirmationContent({ checkoutId }: { checkoutId?: string }) {
  return (
    <div className="container mx-auto max-w-md py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your subscription has been activated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkoutId && (
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground text-sm">
                Order ID: <span className="font-mono">{checkoutId}</span>
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <a href="/">Go to Dashboard</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/settings">View Settings</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent checkoutId={searchParams.checkout_id} />
    </Suspense>
  );
}
