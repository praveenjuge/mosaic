import CTA from "@/components/home/cta";
import HomeSignedIn from "@/components/home/homesignedin";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getOgImageUrl } from "@/lib/utils";
import {
  ClerkLoading,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import {
  ArrowLongDown,
  ArrowLongRight,
  CheckHexagon,
} from "@mynaui/icons-react";
import { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Simplify Your Open Graph Image Creation.",
  description:
    "Transform your website's Open Graph (OG) social images by automating the process using screenshots. Say goodbye to the hassle of designing OG images for every page — let your beautiful website do the talking.",
  openGraph: { images: [getOgImageUrl("")] },
};

const features = [
  "No Code Required",
  "Fully Automated",
  "No Credit Card Required",
];

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
  <div className="flex items-center gap-2">
    <CheckHexagon className="size-5 shrink-0 stroke-2 text-primary" />
    <span>{children}</span>
  </div>
);

export default function Home() {
  return (
    <>
      <SignedOut>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-7 py-10 text-center">
          <Logo />
          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-semibold tracking-tighter">
              {metadata.title as string}
            </h1>
            <p className="text-balance text-base text-muted-foreground">
              {metadata.description}
            </p>
          </div>
          <div className="flex gap-2">
            <ClerkLoading>
              <Button size="lg" disabled>
                Start for Free
                <ArrowLongRight className="ml-2 size-4" stroke={2} />
              </Button>
              <Button variant="outline" size="lg" disabled>
                Sign In
              </Button>
            </ClerkLoading>
            <SignUpButton mode="modal">
              <Button size="lg">
                Start for Free
                <ArrowLongRight className="ml-2 size-4" stroke={2} />
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </SignInButton>
          </div>
          <div className="flex flex-col items-center gap-4 text-muted-foreground md:flex-row">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckHexagon />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <section className="mx-auto my-6 flex max-w-5xl flex-col gap-20">
          <div className="flex flex-col gap-10 text-xs md:flex-row">
            <div className="flex flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
              <Image
                src={`/images/original-example-og.jpg`}
                alt={`Original Open Graph Image`}
                className="h-60 w-full bg-emerald-50 object-cover"
                width={600}
                height={250}
              />
              <div className="flex flex-col gap-1 bg-primary-foreground p-4">
                <p className="font-semibold">
                  To Use or Not to Use Auto Layout in Figma
                </p>
                <p>
                  The debate on whether or not to use Auto Layout in Figma is a
                  hot topic that frequently surfaces on Twitter. Based on my
                  experience with this…
                </p>
                <p className="text-muted-foreground">praveenjuge.com</p>
              </div>
            </div>
            <div className="grid shrink-0 place-items-center text-muted-foreground">
              <ArrowLongRight className="hidden size-7 md:block" />
              <ArrowLongDown className="size-7 md:hidden" />
            </div>
            <div className="flex flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
              <Image
                src={`/images/mosaic-example-og.jpg`}
                alt={`Mosaic Open Graph Image`}
                className="h-60 w-full bg-emerald-50 object-cover"
                width={600}
                height={250}
              />
              <div className="flex flex-col gap-1 bg-primary-foreground p-4">
                <p className="font-semibold">
                  To Use or Not to Use Auto Layout in Figma
                </p>
                <p>
                  The debate on whether or not to use Auto Layout in Figma is a
                  hot topic that frequently surfaces on Twitter. Based on my
                  experience with this…
                </p>
                <p className="text-muted-foreground">praveenjuge.com</p>
              </div>
            </div>
          </div>
          {landingContent.map((content, index) => (
            <div
              key={index}
              className="grid grid-cols-1 items-center gap-10 md:grid-cols-2"
            >
              {index % 2 === 0 ? (
                <>
                  <div className="flex flex-col gap-4">
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
                  <div className="order-first flex flex-col gap-4 md:order-none">
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
      </SignedOut>
      <Suspense>
        <HomeSignedIn />
      </Suspense>
    </>
  );
}
