import {
  DEMO_CLIENT_DAILY_GENERATION_LIMIT,
  DEMO_DAILY_GENERATION_LIMIT,
  PRODUCTION_CLIENT_DAILY_GENERATION_LIMIT,
  PRODUCTION_DAILY_GENERATION_LIMIT,
} from "@/lib/constants";
import type { D1Queryable } from "@/lib/db";

const DAILY_LIMITS = {
  demo: {
    client: DEMO_CLIENT_DAILY_GENERATION_LIMIT,
    global: DEMO_DAILY_GENERATION_LIMIT,
  },
  production: {
    client: PRODUCTION_CLIENT_DAILY_GENERATION_LIMIT,
    global: PRODUCTION_DAILY_GENERATION_LIMIT,
  },
} as const;

type GenerationKind = keyof typeof DAILY_LIMITS;
type BudgetScope = `${GenerationKind}-${"client" | "global"}`;

function utcDayStart(timestamp = Date.now()): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

async function reserveWindowBudget(
  db: D1Queryable,
  scope: BudgetScope,
  key: string,
  limit: number,
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT INTO generation_budgets
         (scope, budget_key, window_start, count)
       VALUES (?, ?, ?, 1)
       ON CONFLICT(scope, budget_key) DO UPDATE SET
         window_start = excluded.window_start,
         count = CASE
           WHEN generation_budgets.window_start = excluded.window_start
             THEN generation_budgets.count + 1
           ELSE 1
         END
       WHERE generation_budgets.window_start != excluded.window_start
          OR generation_budgets.count < ?
       RETURNING count`,
    )
    .bind(scope, key, utcDayStart(), limit)
    .first<{ count: number }>();

  return result !== null;
}

async function refundWindowBudget(
  db: D1Queryable,
  scope: BudgetScope,
  key: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE generation_budgets
       SET count = count - 1
       WHERE scope = ? AND budget_key = ? AND window_start = ? AND count > 0`,
    )
    .bind(scope, key, utcDayStart())
    .run();
}

/**
 * Reserve one screenshot against the client's and the service's daily
 * budgets. A client reservation is refunded when the global budget is spent.
 */
export async function reserveGeneration(
  db: D1Queryable,
  kind: GenerationKind,
  clientKey: string,
): Promise<boolean> {
  const limits = DAILY_LIMITS[kind];
  const clientScope = `${kind}-client` as const;

  if (!(await reserveWindowBudget(db, clientScope, clientKey, limits.client))) {
    return false;
  }
  if (
    await reserveWindowBudget(db, `${kind}-global`, "service", limits.global)
  ) {
    return true;
  }
  await refundWindowBudget(db, clientScope, clientKey);
  return false;
}
