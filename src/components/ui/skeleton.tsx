import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted animate-pulse",
        // A `rounded-*` class from the caller replaces the default radius.
        !className?.includes("rounded-") && "rounded-md",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
