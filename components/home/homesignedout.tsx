import CTA from "@/components/home/cta";
import { Button } from "@/components/ui/button";
import { website_description, website_subtitle } from "@/lib/constants";
import { ClerkLoaded, ClerkLoading, SignUpButton } from "@clerk/nextjs";
import { ArrowLongRight } from "@mynaui/icons-react";
import { Suspense } from "react";
import FeaturesBenefits from "./features-benefits";
import HowItWorks from "./how-it-works";
import LandingPricing from "./landing-pricing";
import OGImageDemo from "./og-image-demo";

// Loading component for auth button
function AuthButtonSkeleton() {
  return (
    <Button size="lg" disabled>
      Start for Free
      <ArrowLongRight className="size-4" stroke={2} />
    </Button>
  );
}

// Auth button component
function AuthButton() {
  return (
    <>
      <ClerkLoading>
        <AuthButtonSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <SignUpButton mode="modal" oauthFlow="popup">
          <Button size="lg">
            Start for Free
            <ArrowLongRight className="size-4" stroke={2} />
          </Button>
        </SignUpButton>
      </ClerkLoaded>
    </>
  );
}

// Hero section component
function HeroSection() {
  return (
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
        <Suspense fallback={<AuthButtonSkeleton />}>
          <AuthButton />
        </Suspense>
      </div>
    </section>
  );
}

// Demo section component
function DemoSection() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted h-96 w-full animate-pulse rounded-lg" />
      }
    >
      <OGImageDemo />
    </Suspense>
  );
}

// Features section component
function FeaturesSection() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted h-64 w-full animate-pulse rounded-lg" />
      }
    >
      <FeaturesBenefits />
    </Suspense>
  );
}

// How it works section component
function HowItWorksSection() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted h-64 w-full animate-pulse rounded-lg" />
      }
    >
      <HowItWorks />
    </Suspense>
  );
}

// Pricing section component
function PricingSection() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted h-64 w-full animate-pulse rounded-lg" />
      }
    >
      <LandingPricing />
    </Suspense>
  );
}

// CTA section component
function CTASection() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted h-32 w-full animate-pulse rounded-lg" />
      }
    >
      <CTA />
    </Suspense>
  );
}

export default function HomeSignedOut() {
  return (
    <>
      <Suspense
        fallback={
          <div className="bg-muted h-64 w-full animate-pulse rounded-lg" />
        }
      >
        <HeroSection />
      </Suspense>

      <DemoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
    </>
  );
}
