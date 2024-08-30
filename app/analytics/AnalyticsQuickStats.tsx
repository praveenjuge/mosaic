import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { parseBytes } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

export default async function AnalyticsQuickStats() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaData: any = await auth()?.sessionClaims?.public_metadata;

  return (
    <div className="grid w-full gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {metaData.images_used || 0} out of {metaData.images_limit || 500}
          </CardTitle>
          <CardDescription>Images Generated</CardDescription>
          <Progress
            className="h-2"
            value={
              ((metaData.images_used || 0) * 100) /
              (metaData.images_limit || 500)
            }
          />
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            {metaData.storage_used || "0 MB"}/
            {metaData.storage_limit || "500 MB"}
          </CardTitle>
          <CardDescription>Storage Used</CardDescription>
          <Progress
            className="h-2"
            value={
              ((parseBytes(metaData.storage_used) || 0) * 100) /
              (parseBytes(metaData.storage_limit) || 1048576 * 50)
            }
          />
        </CardHeader>
      </Card>
    </div>
  );
}
