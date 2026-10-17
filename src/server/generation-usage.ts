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
 * The global reservation, made only while the client's budget still has
 * room, so a client over its own limit never touches the service's count.
 */
function reserveGlobalBudget(
  db: D1Queryable,
  kind: GenerationKind,
  clientKey: string,
) {
  const limits = DAILY_GENERATION_LIMITS[kind];
  return db
    .prepare(
      `INSERT INTO generation_budgets
         (scope, budget_key, window_start, count)
       SELECT ?1, 'service', ?2, 1
       WHERE NOT EXISTS (
         SELECT 1 FROM generation_budgets
         WHERE scope = ?3 AND budget_key = ?4
           AND window_start = ?2 AND count >= ?5
       )
       ON CONFLICT(scope, budget_key) DO UPDATE SET
         window_start = excluded.window_start,
         count = CASE
           WHEN generation_budgets.window_start = excluded.window_start
             THEN generation_budgets.count + 1
           ELSE 1
         END
       WHERE generation_budgets.window_start != excluded.window_start
          OR generation_budgets.count < ?6
       RETURNING count`,
    )
    .bind(
      `${kind}-global`,
      utcDayStart(),
      `${kind}-client`,
      clientKey,
      limits.client,
      limits.global,
    );
}

/**
 * Reserve one screenshot against the client's and the service's daily
 * budgets, in one round trip. The batch is a transaction: the global count
 * only moves while the client has room, and the client reservation then
 * always succeeds. A client reservation is refunded when the global budget
 * is spent.
 */
export async function reserveGeneration(
  db: D1Queryable,
  kind: GenerationKind,
  clientKey: string,
): Promise<boolean> {
  const limits = DAILY_GENERATION_LIMITS[kind];
  const clientScope = `${kind}-client` as const;

  const [global, client] = await db.batch([
    reserveGlobalBudget(db, kind, clientKey),
    reserveWindowBudget(db, clientScope, clientKey, limits.client),
  ]);
  if (client.results.length === 0) return false;
  if (global.results.length > 0) return true;
  await refundWindowBudget(db, clientScope, clientKey);
  return false;
}
