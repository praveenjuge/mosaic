import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserStats } from "@/lib/database-helpers";
import { formatBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

export default async function HomeQuickStats() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>0</CardTitle>
            <CardDescription>Images Generated</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>0 MB</CardTitle>
            <CardDescription>Storage Used</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Subscription</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const userStats = await getUserStats();

  const totalImages = userStats?.total_images ?? 0;
  const totalStorageBytes = userStats?.total_storage_bytes ?? 0;
  const formattedStorage = formatBytes(totalStorageBytes);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{totalImages}</CardTitle>
          <CardDescription>Images Generated</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{formattedStorage}</CardTitle>
          <CardDescription>Storage Used</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Free Plan</CardTitle>
          <CardDescription>Subscription</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
