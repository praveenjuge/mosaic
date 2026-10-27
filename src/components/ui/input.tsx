import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `bare` drops the box (border, background, height, padding, focus ring) for
 * inputs inside a styled container, which set their own size instead.
 */
function Input({
  className,
  type,
  bare = false,
  ...props
}: React.ComponentProps<"input"> & { bare?: boolean }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground disabled:bg-input/50 aria-invalid:ring-destructive/20 dark:disabled:bg-input/80 dark:aria-invalid:ring-destructive/40 w-full min-w-0 bg-transparent py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        !bare &&
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 dark:bg-input/30 h-8 rounded-lg border px-2.5 focus-visible:ring-3",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
