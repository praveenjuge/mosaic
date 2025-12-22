import HomeSignedOut from "@/components/home/homesignedout";
import SignedInDashboard from "@/components/home/SignedInDashboard";
import { website_description, website_subtitle } from "@/lib/constants";
import { getOgImageUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: website_subtitle,
  description: website_description,
  openGraph: { images: [getOgImageUrl("")] },
};

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return <HomeSignedOut />;
  }

  return <SignedInDashboard />;
}
