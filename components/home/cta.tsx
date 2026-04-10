import { ClerkLoaded, ClerkLoading, SignUpButton } from "@clerk/nextjs";
import { MoveRight } from "lucide-react";
import { Button } from "../ui/button";

export default function CTA() {
  return (
    <section className="py-10">
      <div className="bg-background relative mx-auto flex max-w-5xl flex-col items-center justify-center overflow-hidden rounded-lg border-[0.5px] py-16 text-center md:px-6">
        <div className="relative mx-auto flex max-w-xs flex-col items-center justify-center gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Showcase your beautiful website in your OG images
            </h2>
            <p className="text-muted-foreground text-base text-balance">
              Generate click-worthy OG images in seconds, fully automated.
            </p>
          </div>
          <ClerkLoading>
            <Button size="lg" disabled>
              Start for Free
              <MoveRight className="size-4" strokeWidth={2} />
            </Button>
          </ClerkLoading>
          <ClerkLoaded>
            <SignUpButton mode="modal" oauthFlow="popup">
              <Button size="lg">
                Start for Free
                <MoveRight className="size-4" strokeWidth={2} />
              </Button>
            </SignUpButton>
          </ClerkLoaded>
        </div>
      </div>
    </section>
  );
}
