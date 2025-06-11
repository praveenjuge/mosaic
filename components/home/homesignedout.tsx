import CTA from "@/components/home/cta";
import { Button } from "@/components/ui/button";
import { website_description, website_subtitle } from "@/lib/constants";
import { ClerkLoaded, ClerkLoading, SignUpButton } from "@clerk/nextjs";
import { ArrowLongRight, CheckHexagon } from "@mynaui/icons-react";
import Image from "next/image";
import { Suspense } from "react";
import OGImageDemo from "./og-image-demo";

const landingContent = [
  {
    title: "Automated OG Image Creation",
    points: [
      "Generate eye-catching social media OG images",
      "Showcase your beautiful website design effortlessly",
      "Ensure your social media previews always look perfect",
    ],
    image: "/images/landing-1.png",
  },
  {
    title: "Easy Websites Integration",
    points: [
      "Add your website to Mosaic in just a few clicks",
      "No coding skills required",
      "Quick access to important metrics and recent screenshots",
    ],
    image: "/images/landing-2.png",
  },
  {
    title: "Customizable Analytics",
    points: [
      "Track your OG image performance with detailed analytics",
      "Visualize data with interactive charts and graphs",
      "Handle high-volume requests with ease",
    ],
    image: "/images/landing-3.png",
  },
];

const FeaturePoint = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-base">
    <CheckHexagon className="text-primary size-5 shrink-0 stroke-2" />
    <span>{children}</span>
  </div>
);

export default function HomeSignedOut() {
  return (
    <>
      <section className="mx-auto flex max-w-xl flex-col items-center gap-6 py-10 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tighter text-balance md:text-5xl">
            {website_subtitle}
          </h1>
          <p className="text-muted-foreground text-base text-balance">
            {website_description}
          </p>
        </div>
        <div className="flex gap-2">
          <Suspense
            fallback={
              <>
                <Button size="lg" disabled>
                  Start for Free
                  <ArrowLongRight className="size-4" stroke={2} />
                </Button>
              </>
            }
          >
            <ClerkLoading>
              <Button size="lg" disabled>
                Start for Free
                <ArrowLongRight className="size-4" stroke={2} />
              </Button>
            </ClerkLoading>
            <ClerkLoaded>
              <SignUpButton mode="modal">
                <Button size="lg">
                  Start for Free
                  <ArrowLongRight className="size-4" stroke={2} />
                </Button>
              </SignUpButton>
            </ClerkLoaded>
          </Suspense>
        </div>
      </section>
      <OGImageDemo />
      <section className="mx-auto my-14 flex max-w-5xl flex-col gap-24">
        {landingContent.map((content, index) => (
          <div
            key={index}
            className="grid grid-cols-1 items-center gap-10 md:grid-cols-2"
          >
            {index % 2 === 0 ? (
              <>
                <div className="flex flex-col gap-6">
                  <h2 className="text-xl font-semibold">{content.title}</h2>
                  <div className="flex flex-col gap-4">
                    {content.points.map((point, pointIndex) => (
                      <FeaturePoint key={pointIndex}>{point}</FeaturePoint>
                    ))}
                  </div>
                </div>
                <Image
                  src={content.image}
                  alt={content.title}
                  className="w-full object-cover"
                  width={500}
                  height={327}
                />
              </>
            ) : (
              <>
                <Image
                  src={content.image}
                  alt={content.title}
                  className="w-full object-cover"
                  width={500}
                  height={327}
                />
                <div className="order-first flex flex-col gap-6 md:order-none">
                  <h2 className="text-xl font-semibold">{content.title}</h2>
                  <div className="flex flex-col gap-4">
                    {content.points.map((point, pointIndex) => (
                      <FeaturePoint key={pointIndex}>{point}</FeaturePoint>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </section>
      <CTA />
    </>
  );
}
