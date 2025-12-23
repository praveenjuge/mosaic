"use client";

import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <Image
        src="/illustrations/error.png"
        alt="Error occurred"
        width={300}
        height={350}
      />
      <h2 className="font-medium">Something went wrong!</h2>
      <p className="text-muted-foreground">
        We&apos;re sorry for the inconvenience. Please try again later.
      </p>
      <button
        onClick={() => reset()}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Try again
      </button>
    </div>
  );
}
