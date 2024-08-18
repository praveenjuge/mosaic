import { ClerkLoaded, ClerkLoading, SignUpButton } from "@clerk/nextjs";
import { ArrowLongRight } from "@mynaui/icons-react";
import Image from "next/image";
import { Button } from "../ui/button";

export default function CTA() {
  return (
    <section className="pb-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-6 overflow-hidden rounded-lg border-[0.5px] border-black/15 bg-gradient-to-r from-lime-100 via-emerald-100 to-teal-100 p-6 dark:from-lime-600/40 dark:via-emerald-600/40 dark:to-teal-600/40 md:grid-cols-2 md:gap-12 md:px-10">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight md:text-3xl">
              Simplify OG Images.
            </h2>
            <p className="text-balance text-base opacity-60">
              Generate click-worthy OG images in minutes, no coding required.
            </p>
          </div>
          <ClerkLoading>
            <Button variant="outline" disabled>
              Start for Free
              <ArrowLongRight className="ml-2 size-4" stroke={2} />
            </Button>
          </ClerkLoading>
          <ClerkLoaded>
            <SignUpButton mode="modal">
              <Button variant="outline">
                Start for Free
                <ArrowLongRight className="ml-2 size-4" stroke={2} />
              </Button>
            </SignUpButton>
          </ClerkLoaded>
        </div>
        <div className="relative h-80">
          <Image
            alt="CTA Image"
            width={600}
            height={400}
            src="/images/analytics.png"
            className="absolute left-0 top-0 h-96 max-w-none rounded-lg bg-emerald-50 object-cover object-center ring-[0.5px] ring-black/15 dark:bg-emerald-950"
          />
        </div>
      </div>
    </section>
  );
}
