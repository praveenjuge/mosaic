import type { BudgetUsage, DashboardBudget } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { DashboardPanel } from "./dashboard-panel";

function Meter({
  label,
  description,
  usage,
}: {
  label: string;
  description: string;
  usage: BudgetUsage;
}) {
  const left = Math.max(0, usage.limit - usage.used);
  const ratio = Math.min(1, usage.used / usage.limit);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm tabular-nums">
          {formatNumber(usage.used)}
          <span className="text-muted-foreground">
            {" "}
            / {formatNumber(usage.limit)}
          </span>
        </p>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={usage.limit}
        aria-valuenow={usage.used}
        className="bg-muted h-1.5 overflow-hidden rounded-full"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            ratio >= 0.9 ? "bg-chart-3" : "bg-chart-1",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {left === 0
          ? "Limit reached. Cached images keep serving."
          : `${formatNumber(left)} left. ${description}`}
      </p>
    </div>
  );
}

export function DashboardUsage({
  budget,
  className,
}: {
  budget: DashboardBudget;
  className?: string;
}) {
  return (
    <DashboardPanel
      title="Today's usage"
      description="New screenshots since midnight UTC"
      className={className}
    >
      <div className="flex flex-1 flex-col gap-6 px-5 pt-1 pb-5">
        <Meter
          label="Your screenshots"
          description="Adding websites and regenerating pages count here."
          usage={budget.user}
        />
        <Meter
          label="Service capacity"
          description="Shared by every /use request on Mosaic."
          usage={budget.service}
        />
        <p className="text-muted-foreground mt-auto border-t pt-4 text-xs">
          Cached images never count.{" "}
          <Link
            to="/help/$slug"
            params={{ slug: "understanding-usage-limits" }}
            className="text-foreground underline underline-offset-4"
          >
            How limits work
          </Link>
        </p>
      </div>
    </DashboardPanel>
  );
}
