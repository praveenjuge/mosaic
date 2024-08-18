import FetchWebsitePagesData from "@/components/server/fetch-website-pages-data";
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
    plan?: { name: string };
  };
  const response = await FetchWebsitePagesData({ page: 1, limit: 5 });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{response.meta.total}</CardTitle>
          <CardDescription>Images</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>30 Days</CardTitle>
          <CardDescription>Cached</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{metaData?.plan?.name || "Free Plan"}</CardTitle>
          <CardDescription>Subscription</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
