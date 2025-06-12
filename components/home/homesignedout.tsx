import CTA from "@/components/home/cta";
import { Button } from "@/components/ui/button";
import { website_description, website_subtitle } from "@/lib/constants";
import { ClerkLoaded, ClerkLoading, SignUpButton } from "@clerk/nextjs";
import { ArrowLongRight } from "@mynaui/icons-react";
import { Suspense } from "react";
import FeaturesBenefits from "./features-benefits";
import HowItWorks from "./how-it-works";
import OGImageDemo from "./og-image-demo";

export default function HomeSignedOut() {
  return (
    <>
      <section className="mx-auto flex max-w-xl flex-col items-center gap-6 pt-10 text-center">
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
      <HowItWorks />
      <FeaturesBenefits />
      <CTA />
    </>
  );
}
