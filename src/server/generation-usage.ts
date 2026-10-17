import { DAILY_GENERATION_LIMITS } from "@/lib/constants";
import type { D1Queryable } from "@/lib/db";

type GenerationKind = keyof typeof DAILY_GENERATION_LIMITS;
type BudgetScope = `${GenerationKind}-${"client" | "global"}`;

function utcDayStart(timestamp = Date.now()): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function reserveWindowBudget(
  db: D1Queryable,
  scope: BudgetScope,
  key: string,
  limit: number,
) {
  return db
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
    .bind(scope, key, utcDayStart(), limit);
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
 * budgets. Both reservations go in one round trip; when only one succeeds,
 * it is refunded.
 */
export async function reserveGeneration(
  db: D1Queryable,
  kind: GenerationKind,
  clientKey: string,
): Promise<boolean> {
  const limits = DAILY_GENERATION_LIMITS[kind];
  const clientScope = `${kind}-client` as const;
  const globalScope = `${kind}-global` as const;

  const [client, global] = await db.batch([
    reserveWindowBudget(db, clientScope, clientKey, limits.client),
    reserveWindowBudget(db, globalScope, "service", limits.global),
  ]);
  const clientReserved = client.results.length > 0;
  const globalReserved = global.results.length > 0;
  if (clientReserved && globalReserved) return true;

  if (clientReserved) await refundWindowBudget(db, clientScope, clientKey);
  if (globalReserved) await refundWindowBudget(db, globalScope, "service");
  return false;
}
