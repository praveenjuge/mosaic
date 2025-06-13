import HomeSignedOut from "@/components/home/homesignedout";
import SignedInDashboard from "@/components/home/SignedInDashboard";
import { website_description, website_subtitle } from "@/lib/constants";
import { getOgImageUrl } from "@/lib/utils";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: website_subtitle,
  description: website_description,
  openGraph: { images: [getOgImageUrl("")] },
};

export default function Home() {
  return (
    <>
      <SignedOut>
        <HomeSignedOut />
      </SignedOut>
      <SignedIn>
        <SignedInDashboard />
      </SignedIn>
    </>
  );
}
