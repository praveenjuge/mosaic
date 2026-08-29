import {
  DEMO_CLIENT_DAILY_GENERATION_LIMIT,
  DEMO_DAILY_GENERATION_LIMIT,
} from "@/lib/constants";

export type GenerationReservation =
  | { reserved: true }
  | { reserved: false; reason: "monthly-limit" };

function utcDayStart(timestamp = Date.now()): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function utcMonthStart(timestamp = Date.now()): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

async function reserveWindowBudget(
  db: D1Database,
  scope: "demo-client" | "demo-global",
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

export async function reserveDemoGeneration(
  db: D1Database,
  clientKey: string,
): Promise<boolean> {
  const clientReserved = await reserveWindowBudget(
    db,
    "demo-client",
    clientKey,
    DEMO_CLIENT_DAILY_GENERATION_LIMIT,
  );
  if (!clientReserved) return false;

  const globalReserved = await reserveWindowBudget(
    db,
    "demo-global",
    "service",
    DEMO_DAILY_GENERATION_LIMIT,
  );
  if (!globalReserved) {
    await refundWindowBudget(db, "demo-client", clientKey);
  }
  return globalReserved;
}

export async function reserveProductionGeneration(
  db: D1Database,
  userId: string,
): Promise<GenerationReservation> {
  const monthlyUsage = await db
    .prepare(
      `INSERT INTO user_usage (user_id, period_start, generated_total)
       VALUES (?, ?, 1)
       ON CONFLICT(user_id) DO UPDATE SET
         period_start = excluded.period_start,
         generated_total = CASE
           WHEN user_usage.period_start = excluded.period_start
             THEN user_usage.generated_total + 1
           ELSE 1
         END
       WHERE user_usage.period_start != excluded.period_start
          OR user_usage.plan = 'pro-yearly'
          OR user_usage.generated_total < CASE user_usage.plan
               WHEN 'pro' THEN 5000
               ELSE 500
             END
       RETURNING generated_total`,
    )
    .bind(userId, utcMonthStart())
    .first<{ generated_total: number }>();

  if (!monthlyUsage) {
    return { reserved: false, reason: "monthly-limit" };
  }

  return { reserved: true };
}

export async function refundUserGeneration(
  db: D1Database,
  userId: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE user_usage
       SET generated_total = generated_total - 1
       WHERE user_id = ? AND period_start = ? AND generated_total > 0`,
    )
    .bind(userId, utcMonthStart())
    .run();
}

async function refundWindowBudget(
  db: D1Database,
  scope: "demo-client" | "demo-global",
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
