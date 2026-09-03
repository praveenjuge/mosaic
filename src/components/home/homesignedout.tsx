import FAQ from "@/components/faq";
import CTA from "@/components/home/cta";
import { Button } from "@/components/ui/button";
import { authenticatedHomePath } from "@/lib/clerk-auth";
import {
  ClerkLoaded,
  ClerkLoading,
  SignUpButton,
} from "@clerk/tanstack-react-start";
import { MoveRight } from "lucide-react";
import FeaturesBenefits from "./features-benefits";
import HowItWorks from "./how-it-works";
import LandingPricing from "./landing-pricing";
import OGImageDemo from "./og-image-demo";

function AuthButtonSkeleton() {
  return (
    <Button size="lg" disabled>
      Start for Free
      <MoveRight className="size-4" strokeWidth={2} />
    </Button>
  );
}

function AuthButton() {
  return (
    <>
      <ClerkLoading>
        <AuthButtonSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <SignUpButton
          fallbackRedirectUrl={authenticatedHomePath}
          forceRedirectUrl={authenticatedHomePath}
        >
          <Button size="lg">
            Start for Free
            <MoveRight className="size-4" strokeWidth={2} />
          </Button>
        </SignUpButton>
      </ClerkLoaded>
    </>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tighter text-balance md:text-5xl">
          OG images from a screenshot of your site.{" "}
          <span className="text-primary">No design needed.</span>
        </h1>
        <p className="text-muted-foreground text-base text-balance md:text-lg">
          Mosaic captures your page at 1200x630 and serves that image as the
          social preview. Add the URL to your og:image tag.
        </p>
      </div>
      <AuthButton />
    </section>
  );
}

function FeaturesSection() {
  return <FeaturesBenefits />;
}

function PricingSection() {
  return <LandingPricing />;
}

function CTASection() {
  return <CTA />;
}

function FAQSection() {
  return (
    <section className="mx-auto max-w-4xl pt-10">
      <div className="mb-12 md:text-center">
        <h2 className="mb-3 text-3xl font-semibold tracking-tighter">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-lg">
          Common questions about OG Images and our service.
        </p>
      </div>
      <FAQ showCard={false} />
    </section>
  );
}

export default function HomeSignedOut() {
  return (
    <>
      <HeroSection />
      <OGImageDemo />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
