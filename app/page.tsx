import HomeView from "@/components/home/home-view";
import { website_subtitle } from "@/lib/constants";
import { getMarkDownData } from "@/lib/getMarkdown";
import { getOgImageUrl } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: website_subtitle,
  description: "Instantly turn your website's hero sections into stunning OG images—no design skills needed. Boost brand visibility and drive clicks with automated, high-converting social previews.",
  openGraph: { images: [getOgImageUrl("")] },
};

export default function Home() {
  const changelogEntries = getMarkDownData("content/changelog/");

  return <HomeView changelogEntries={changelogEntries} />;
}
