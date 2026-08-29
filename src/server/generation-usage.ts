import {
  DEMO_CLIENT_DAILY_GENERATION_LIMIT,
  DEMO_DAILY_GENERATION_LIMIT,
  PRODUCTION_CLIENT_DAILY_GENERATION_LIMIT,
  PRODUCTION_DAILY_GENERATION_LIMIT,
} from "@/lib/constants";

type BudgetScope =
  | "demo-client"
  | "demo-global"
  | "production-client"
  | "production-global";

function utcDayStart(timestamp = Date.now()): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

async function reserveWindowBudget(
  db: D1Database,
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
  db: D1Database,
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

async function reserveClientAndGlobalBudget(
  db: D1Database,
  clientScope: "demo-client" | "production-client",
  globalScope: "demo-global" | "production-global",
  clientKey: string,
  clientLimit: number,
  globalLimit: number,
): Promise<boolean> {
  const clientReserved = await reserveWindowBudget(
    db,
    clientScope,
    clientKey,
    clientLimit,
  );
  if (!clientReserved) return false;

  const globalReserved = await reserveWindowBudget(
    db,
    globalScope,
    "service",
    globalLimit,
  );
  if (!globalReserved) {
    await refundWindowBudget(db, clientScope, clientKey);
  }
  return globalReserved;
}

export function reserveDemoGeneration(db: D1Database, clientKey: string) {
  return reserveClientAndGlobalBudget(
    db,
    "demo-client",
    "demo-global",
    clientKey,
    DEMO_CLIENT_DAILY_GENERATION_LIMIT,
    DEMO_DAILY_GENERATION_LIMIT,
  );
}

export function reserveProductionGeneration(db: D1Database, clientKey: string) {
  return reserveClientAndGlobalBudget(
    db,
    "production-client",
    "production-global",
    clientKey,
    PRODUCTION_CLIENT_DAILY_GENERATION_LIMIT,
    PRODUCTION_DAILY_GENERATION_LIMIT,
  );
}
