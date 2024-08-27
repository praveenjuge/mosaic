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
    plan?: string;
    images_used?: number;
    storage_used?: string;
  };
  const response = await FetchWebsitePagesData({ page: 1, limit: 5 });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{metaData.images_used || response.meta.total}</CardTitle>
          <CardDescription>Images Generated</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{metaData?.storage_used ?? "0 Bytes"}</CardTitle>
          <CardDescription>Storage Used</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{metaData?.plan || "Free Plan"}</CardTitle>
          <CardDescription>Subscription</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
