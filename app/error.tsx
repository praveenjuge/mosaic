"use client";

import { buttonVariants } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/error.png"
        alt="Error occurred"
        style={{ width: "350px" }}
      />
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
