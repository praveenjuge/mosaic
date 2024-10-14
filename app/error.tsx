"use client";

import { buttonVariants } from "@/components/ui/button";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <h2 className="font-medium">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Try again
      </button>
    </div>
  );
}
