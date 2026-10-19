import { DAILY_GENERATION_LIMITS } from "@/lib/constants";
import type {
  DashboardBudget,
  DashboardImageSummary,
  DashboardStats,
} from "@/lib/types";
import { stripTrailingSlashes } from "@/lib/url";

export type DashboardWebsiteRow = DashboardStats["websites"][number];

/** Today's `generation_budgets` rows for the service and the user. */
export type BudgetRow = { scope: string; count: number };

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildDashboardBudget(
  rows: BudgetRow[],
  dayStart: number,
): DashboardBudget {
  const used = (scope: string) =>
    rows.find((row) => row.scope === scope)?.count ?? 0;
  const limits = DAILY_GENERATION_LIMITS.production;
  return {
    service: { used: used("production-global"), limit: limits.global },
    user: { used: used("production-client"), limit: limits.client },
    resets_at: dayStart + DAY_MS,
  };
}

export function buildDashboardStats(
  websites: DashboardWebsiteRow[],
  latestImages: DashboardImageSummary[],
  budget: DashboardBudget,
): DashboardStats {
  return {
    total_websites: websites.length,
    total_images: websites.reduce(
      (total, website) => total + website.image_count,
      0,
    ),
    websites,
    latest_screenshots: latestImages.map((image) => ({
      ...image,
      page_url: stripTrailingSlashes(image.page_url),
    })),
    budget,
  };
}
