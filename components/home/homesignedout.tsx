import CTA from "@/components/home/cta";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { website_description, website_subtitle } from "@/lib/constants";
import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import {
  ArrowLongDown,
  ArrowLongRight,
  CheckHexagon,
  FatCornerRightDown,
} from "@mynaui/icons-react";
import Image from "next/image";
import { Suspense } from "react";
import { Input } from "../ui/input";

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
    <CheckHexagon className="size-5 shrink-0 stroke-2 text-primary" />
    <span>{children}</span>
  </div>
);

export default function HomeSignedOut() {
  return (
    <>
      <section className="mx-auto flex max-w-xl flex-col items-center gap-6 py-6 text-center">
        <Logo />
        <div className="space-y-3">
          <h1 className="text-balance text-4xl font-semibold tracking-tighter md:text-5xl">
            {website_subtitle}
          </h1>
          <p className="text-balance text-base text-muted-foreground">
            {website_description}
          </p>
        </div>
        <div className="flex gap-2">
          <Suspense
            fallback={
              <>
                <Button size="lg" disabled>
                  Start for Free
                  <ArrowLongRight className="ml-2 size-4" stroke={2} />
                </Button>
                <Button variant="outline" size="lg" disabled>
                  Sign In
                </Button>
              </>
            }
          >
            <ClerkLoading>
              <Button size="lg" disabled>
                Start for Free
                <ArrowLongRight className="ml-2 size-4" stroke={2} />
              </Button>
              <Button variant="outline" size="lg" disabled>
                Sign In
              </Button>
            </ClerkLoading>
            <ClerkLoaded>
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
            </ClerkLoaded>
          </Suspense>
        </div>
      </section>
      <section className="relative -mt-10 border-b-[0.5px] py-16 md:-mx-10">
        <Image
          src="/images/homebg.png"
          alt="CTA"
          width={1000}
          height={1000}
          className="pointer-events-none absolute left-0 top-0 -z-10 hidden size-full select-none object-cover object-top dark:hidden md:block"
        />
        <div className="relative mx-auto max-w-4xl sm:px-4">
          <form className="mb-6 hidden gap-4">
            <Input placeholder="https://praveenjuge.com" />
            <Button variant="outline">
              Live Demo of your New OG Image
              <FatCornerRightDown className="ml-2" />
            </Button>
          </form>
          <div className="flex flex-col gap-4 text-xs md:flex-row">
            <div className="flex flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
              <Image
                src="/images/original-example-og.jpg"
                alt="Original Open Graph Image"
                className="h-52 w-full object-cover"
                width={600}
                height={250}
              />
              <div className="flex flex-col gap-0.5 bg-primary-foreground p-3.5">
                <p className="font-semibold">
                  To Use or Not to Use Auto Layout in Figma
                </p>
                <p className="line-clamp-2">
                  The debate on whether or not to use Auto Layout in Figma is a
                  hot topic that frequently surfaces on Twitter. Based on my
                  experience with this…
                </p>
                <p className="text-muted-foreground">praveenjuge.com</p>
              </div>
            </div>
            <span className="pointer-events-none grid shrink-0 select-none place-items-center text-muted-foreground">
              <ArrowLongRight className="hidden size-7 md:block" />
              <ArrowLongDown className="size-7 md:hidden" />
            </span>
            <div className="flex flex-col divide-y-[0.5px] overflow-hidden rounded-lg border-[0.5px]">
              <Image
                src="/images/mosaic-example-og.png"
                alt="Mosaic Open Graph Image"
                className="h-52 w-full object-cover"
                width={600}
                height={250}
              />
              <div className="flex flex-col gap-0.5 bg-primary-foreground p-3.5">
                <p className="font-semibold">
                  To Use or Not to Use Auto Layout in Figma
                </p>
                <p className="line-clamp-2">
                  The debate on whether or not to use Auto Layout in Figma is a
                  hot topic that frequently surfaces on Twitter. Based on my
                  experience with this…
                </p>
                <p className="text-muted-foreground">praveenjuge.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>
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
