import { ClerkLoaded, ClerkLoading, SignUpButton } from "@clerk/nextjs";
import { ArrowLongRight } from "@mynaui/icons-react";
import Image from "next/image";
import { Button } from "../ui/button";

export default function CTA() {
  return (
    <section className="pb-10">
      <div className="relative mx-auto flex h-96 max-w-5xl flex-col overflow-hidden rounded-lg border-[0.5px] border-black/20 bg-primary-foreground px-6 py-16 text-center">
        <Image
          src="/images/cta.png"
          alt="CTA"
          width={1000}
          height={1000}
          className="pointer-events-none absolute left-0 top-0 size-full select-none object-cover object-bottom"
        />
        <div className="relative mx-auto flex max-w-xs flex-col items-center justify-center gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-black md:text-2xl">
              Showcase your beautiful website in your OG images
            </h2>
            <p className="text-balance text-base text-black/60">
              Generate click-worthy OG images in seconds, fully automated.
            </p>
          </div>
          <ClerkLoading>
            <Button disabled>
              Start for Free
              <ArrowLongRight className="ml-2 size-4" stroke={2} />
            </Button>
          </ClerkLoading>
          <ClerkLoaded>
            <SignUpButton mode="modal">
              <Button>
                Start for Free
                <ArrowLongRight className="ml-2 size-4" stroke={2} />
              </Button>
            </SignUpButton>
          </ClerkLoaded>
        </div>
      </div>
    </section>
  );
}
