import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getUserStats } from "@/lib/database-helpers";
import { UserMetaData } from "@/lib/types";
import { formatBytes, parseBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

export default async function AnalyticsQuickStats() {
  const userData = await auth();
  const metaData =
    (await userData?.sessionClaims?.public_metadata) as UserMetaData;

  // Get actual data from Supabase
  let actualStats = null;
  if (userData?.userId) {
    actualStats = await getUserStats(userData.userId);
  }

  // Use actual data from DB if available, fallback to metadata
  const imagesUsed = actualStats?.total_images || metaData?.images_used || 0;
  const imagesLimit = metaData?.images_limit || 500;
  const storageUsed = actualStats?.total_storage_bytes
    ? formatBytes(actualStats.total_storage_bytes)
    : (metaData?.storage_used || "0 MB");
  const storageLimit = metaData?.storage_limit || "500 MB";

  return (
    <div className="grid w-full gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {imagesUsed} out of {imagesLimit}
          </CardTitle>
          <CardDescription>Images Generated</CardDescription>
          <Progress
            className="h-2"
            value={(imagesUsed * 100) / imagesLimit}
          />
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            {storageUsed}/{storageLimit}
          </CardTitle>
          <CardDescription>Storage Used</CardDescription>
          <Progress
            className="h-2"
            value={((parseBytes(storageUsed) || 0) * 100) /
              (parseBytes(storageLimit) || 1048576 * 50)}
          />
        </CardHeader>
      </Card>
    </div>
  );
}
