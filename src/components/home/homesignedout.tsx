import { SignUpLink } from "@/components/auth/auth-links";
import FAQ from "@/components/faq";
import CTA from "@/components/home/cta";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import FeaturesBenefits from "./features-benefits";
import HowItWorks from "./how-it-works";
import LandingPricing from "./landing-pricing";
import OGImageDemo from "./og-image-demo";
import { SectionHeading } from "./section-heading";

function HeroSection() {
  return (
    <section className="relative isolate flex flex-col items-center text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-28 -z-10 mx-auto h-112 max-w-4xl bg-[radial-gradient(closest-side,var(--brand-muted),transparent)] opacity-80"
      />
      <p className="text-muted-foreground bg-background mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-xs">
        <span className="bg-brand size-1.5 rounded-full" aria-hidden="true" />
        Open Graph images, automated
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter text-balance sm:text-5xl md:text-6xl md:leading-[1.05]">
        Instant beautiful OG images{" "}
        <span className="text-muted-foreground">from your website.</span>
      </h1>
      <p className="text-muted-foreground mt-5 max-w-xl text-base text-balance md:text-lg">
        Mosaic screenshots your pages and serves them as link previews for X,
        LinkedIn, Slack, and everywhere else. One meta tag, no design work.
      </p>
      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <SignUpLink size="lg">
          Start for free
          <ArrowRight data-icon="inline-end" />
        </SignUpLink>
        <Button asChild variant="outline" size="lg">
          <Link to="/" hash="how-it-works">
            See how it works
          </Link>
        </Button>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section
      id="faq"
      className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16"
    >
      <SectionHeading
        eyebrow="FAQ"
        title="Questions, answered"
        description={
          <>
            Can&apos;t find what you need? Browse the{" "}
            <Link
              to="/help"
              className="text-foreground underline underline-offset-4"
            >
              help center
            </Link>{" "}
            or{" "}
            <a
              href="mailto:hello@praveenjuge.com"
              className="text-foreground underline underline-offset-4"
            >
              email us
            </a>
            .
          </>
        }
      />
      <FAQ />
    </section>
  );
}

export default function HomeSignedOut() {
  return (
    <div className="flex flex-col gap-28 md:gap-36">
      <div className="flex flex-col gap-14 md:gap-16">
        <HeroSection />
        <OGImageDemo />
      </div>
      <FeaturesBenefits />
      <HowItWorks />
      <LandingPricing />
      <FAQSection />
      <CTA />
    </div>
  );
}
