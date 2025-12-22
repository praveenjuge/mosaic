import HomeSignedOut from "@/components/home/homesignedout";
import SignedInDashboard from "@/components/home/SignedInDashboard";
import { website_description, website_subtitle } from "@/lib/constants";
import { getOgImageUrl } from "@/lib/utils";
import { Authenticated, Unauthenticated } from "convex/react";
import { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: website_subtitle,
  description: website_description,
  openGraph: { images: [getOgImageUrl("")] },
};

export default function Home() {
  return (
    <>
      <Unauthenticated>
        <HomeSignedOut />
      </Unauthenticated>
      <Authenticated>
        <SignedInDashboard />
      </Authenticated>
    </>
  );
}
