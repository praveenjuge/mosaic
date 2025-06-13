import { ClerkLoaded, ClerkLoading, SignUpButton } from "@clerk/nextjs";
import { ArrowLongRight } from "@mynaui/icons-react";
import Image from "next/image";
import { Button } from "../ui/button";

export default function CTA() {
  return (
    <section className="py-10">
      <div className="bg-background relative mx-auto flex h-96 max-w-5xl flex-col items-center justify-center overflow-hidden rounded-lg border-[0.5px] py-16 text-center md:px-6">
        <Image
          src="/illustrations/cta.png"
          alt="CTA"
          width={1000}
          height={1000}
          className="pointer-events-none absolute top-0 left-0 size-full object-cover object-center select-none"
        />
        <div className="relative mx-auto flex max-w-xs flex-col items-center justify-center gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
              Showcase your beautiful website in your OG images
            </h2>
            <p className="text-base text-balance text-white">
              Generate click-worthy OG images in seconds, fully automated.
            </p>
          </div>
          <ClerkLoading>
            <Button disabled>
              Start for Free
              <ArrowLongRight className="size-4" stroke={2} />
            </Button>
          </ClerkLoading>
          <ClerkLoaded>
            <SignUpButton mode="modal" oauthFlow="popup">
              <Button>
                Start for Free
                <ArrowLongRight className="size-4" stroke={2} />
              </Button>
            </SignUpButton>
          </ClerkLoaded>
        </div>
      </div>
    </section>
  );
}
