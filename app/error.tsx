"use client";

import { buttonVariants } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO, Add Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h2 className="fone-semibold">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Try again
      </button>
    </div>
  );
}
