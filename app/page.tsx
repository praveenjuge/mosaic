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
import { CheckHexagon } from "@mynaui/icons-react";
import WebsitesTable from "./websites/WebsitesTable";

async function fetchLatestImages(token: string) {
  const url = "https://get.mosaicimg.com/api/websites/latest_images";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export default async function Home() {
  let latestImages = [];
  try {
    const { getToken } = auth();
    const token = await getToken({ template: "supabase" });
    if (token) {
      const response = await fetchLatestImages(token);
      latestImages = response.images;
    }
  } catch (error) {
    console.log(error);
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
              </Button>
              <Button variant="outline" size="lg" disabled>
                Sign In
              </Button>
            </ClerkLoading>
            <SignUpButton mode="modal">
              <Button size="lg">Start for Free</Button>
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
          <CardHeader className="mb-4 p-0">
            <CardTitle>Latest Cached Images</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {latestImages.map((image: any) => (
              <div className="aspect-[1200/630] w-full" key={image.image_url}>
                <Card className="h-full">
                  <img
                    src={
                      "https://ddvbpf2rl5x5r.cloudfront.net/" + image.image_key
                    }
                    alt={image.title}
                    className="h-full w-full rounded-lg object-cover"
                  />
                </Card>
              </div>
            ))}
          </div>
        </div>
      </SignedIn>
    </>
  );
}
