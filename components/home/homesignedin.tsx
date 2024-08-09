import WebsitesTable from "@/app/websites/WebsitesTable";
import LatestScreenshots from "@/components/latest-screenshots";
import FetchWebsitePagesData from "@/components/server/fetch-website-pages-data";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignedIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function HomeSignedIn() {
  const userData = await auth();
  const metaData: any = await userData?.sessionClaims?.public_metadata;
  let websitePagesData = [];
  const response = await FetchWebsitePagesData({ page: 1, limit: 5 });
  if (!response || !response?.data) {
    console.log("No data");
  } else {
    websitePagesData = response.data;
  }

  return (
    <SignedIn>
      <div>
        <CardHeader className="mb-4 p-0">
          <CardTitle>Overview</CardTitle>
        </CardHeader>
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
              <CardTitle>{metaData?.plan?.name || 'Free Plan'}</CardTitle>
              <CardDescription>Subscription</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
      <div>
        <CardHeader className="mb-4 p-0">
          <CardTitle>Websites</CardTitle>
        </CardHeader>
        <WebsitesTable />
      </div>
      <div>
        <LatestScreenshots
          websitePages={websitePagesData}
          showPagination={false}
        />
      </div>
    </SignedIn>
  );
}
