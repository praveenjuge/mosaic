import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** A titled dashboard section on a card surface. */
export function DashboardPanel({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-card flex min-w-0 flex-col rounded-xl border shadow-xs",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="font-medium">{title}</h2>
          {description ? (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
