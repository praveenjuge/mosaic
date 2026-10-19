import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** A landing page section's eyebrow, title, and lede. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
      )}
    >
      <p className="text-brand text-sm font-medium">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground text-base text-balance">
          {description}
        </p>
      ) : null}
    </div>
  );
}
