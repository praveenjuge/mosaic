import Logo from "@/components/logo";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "vadivam-react";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface relative isolate flex min-h-screen flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-96 max-w-3xl bg-[radial-gradient(closest-side,var(--brand-muted),transparent)]"
      />
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to site
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 pt-6 pb-20">
        {children}
      </main>
    </div>
  );
}
