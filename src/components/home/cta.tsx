import { SignUpLink } from "@/components/auth/auth-links";
import { MoveRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-10">
      <div className="bg-background relative mx-auto flex max-w-4xl flex-col items-center justify-center overflow-hidden rounded-lg border py-16 text-center md:px-6">
        <div className="relative mx-auto flex max-w-xs flex-col items-center justify-center gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Showcase your beautiful website in your OG images
            </h2>
            <p className="text-muted-foreground text-base text-balance">
              Generate click-worthy OG images in seconds, fully automated.
            </p>
          </div>
          <SignUpLink size="lg">
            Start for Free
            <MoveRight className="size-4" strokeWidth={2} />
          </SignUpLink>
        </div>
      </div>
    </section>
  );
}
