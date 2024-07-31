import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, CheckHexagon } from "@mynaui/icons-react";
import WebsitesTable from "./websites/WebsitesTable";
import FetchWebsitePagesData from "@/components/server/fetch-website-pages-data";
import LatestScreenshots from "@/components/latest-screenshots";


export default async function Home() {
  let websitePagesData = []
  const response = await FetchWebsitePagesData({ page: 1, limit: 5 });
  if (!response || !response?.data) {
    console.log("No data");
  } else {
    websitePagesData = response.data;
  }

  return (
    <>
      <SignedOut>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-7 text-center">
          <Logo />
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-semibold tracking-tighter">
              Simplify Your Open Graph Image Creation.
            </h1>
            <p className="text-pretty text-base text-muted-foreground">
              Transform your website into a stunning Open Graph image with
              Mosaic. Simply input your URL, and get a high-quality snapshot
              ready for social media.
            </p>
          </div>
          <div className="flex gap-2">
            <ClerkLoading>
              <Button size="lg" disabled>
                Start for Free
                <ArrowRight className="ml-2 size-4" stroke={2} />
              </Button>
              <Button variant="outline" size="lg" disabled>
                Sign In
              </Button>
            </ClerkLoading>
            <SignUpButton mode="modal">
              <Button size="lg">
                Start for Free
                <ArrowRight className="ml-2 size-4" stroke={2} />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </SignInButton>
          </div>
          <div className="flex flex-col items-center gap-4 text-muted-foreground md:flex-row">
            <div className="flex items-center gap-2">
              <CheckHexagon />
              <span>No Code Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckHexagon />
              <span>Fully Automated</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckHexagon />
              <span>No Credit Card Required</span>
            </div>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <div>
          <CardHeader className="mb-4 p-0">
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>413</CardTitle>
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
                <CardTitle>Free Plan</CardTitle>
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
          <LatestScreenshots websitePages={websitePagesData} showPagination={false} />
        </div>
      </SignedIn>
    </>
  );
}
