import LatestScreenshots from "@/components/latest-screenshots";
import FetchWebsitePagesData from "@/components/server/fetch-website-pages-data";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";

export default async function HomeSignedIn() {
  const userData = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaData: any = await userData?.sessionClaims?.public_metadata;
  let websitePagesData = [];
  const response = await FetchWebsitePagesData({ page: 1, limit: 5 });
  if (!response || !response?.data) {
    console.log("No data");
  } else {
    websitePagesData = response.data;
  }

  return (
    <>
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
      <CardHeader className="p-0">
        <CardTitle>Latest Screenshots</CardTitle>
      </CardHeader>
      <LatestScreenshots
        websitePages={websitePagesData}
        showPagination={false}
      />
    </>
  );
}
