import { SignUpLink } from "@/components/auth/auth-links";
import { ArrowRight } from "vadivam-react";

export default function CTA() {
  return (
    <section className="bg-primary text-primary-foreground relative isolate overflow-hidden rounded-3xl px-6 py-16 text-center md:py-20">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-40 -z-10 mx-auto h-80 max-w-2xl bg-[radial-gradient(closest-side,var(--brand),transparent)] opacity-40"
      />
      <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        Let your website be its own preview
      </h2>
      <p className="text-primary-foreground/70 mx-auto mt-4 max-w-md text-base text-balance">
        Add your first site in under a minute. Free to start, no card needed.
      </p>
      <div className="mt-8 flex justify-center">
        <SignUpLink
          size="lg"
          className="bg-primary-foreground! text-primary! hover:bg-primary-foreground/90!"
        >
          Start for free
          <ArrowRight data-icon="inline-end" />
        </SignUpLink>
      </div>
    </section>
  );
}
