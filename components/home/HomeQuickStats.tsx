import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";

export default async function HomeQuickStats() {
  const userData = await auth();
  const metaData = (await userData?.sessionClaims?.public_metadata) as {
    plan?: string;
    images_used?: number;
    storage_used?: string;
  };

  const formatPlan = (plan: string | undefined) => {
    if (!plan) return "Free Plan";
    const capitalizedPlan =
      plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    return `${capitalizedPlan} Plan`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{metaData.images_used || "0"}</CardTitle>
          <CardDescription>Images Generated</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{metaData?.storage_used ?? "0 MB"}</CardTitle>
          <CardDescription>Storage Used</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{formatPlan(metaData?.plan)}</CardTitle>
          <CardDescription>Subscription</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
