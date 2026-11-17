/**
 * Daily screenshot budgets, counted per UTC day in `generation_budgets`: one
 * row per client and one for the whole service, for production `/use`
 * screenshots and for the home page demo.
 */

import type { DashboardBudget } from "@/lib/types";
import { DAY_MS, utcDayStart } from "@/lib/utils";
import type { D1Queryable } from "@/server/db";

type GenerationKind = "production" | "demo";

/**
 * Maximum fresh screenshots per UTC day, across the service (`global`) and
 * for one client IP (`client`). Demo covers the anonymous home page demo.
 */
export const DAILY_GENERATION_LIMITS = {
  production: { global: 500, client: 50 },
  demo: { global: 100, client: 10 },
} as const;

type BudgetScope = `${GenerationKind}-${"client" | "global"}`;

const SERVICE_KEY = "service";

/** A request's client: its IP address. */
export function requestClientKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "unknown";
}

/** The client for screenshots a signed-in user starts from the dashboard. */
export function userClientKey(userId: string): string {
  return `user:${userId}`;
}

/**
 * Upsert tail that adds one to today's count, or starts a new day at one.
 * The statement's last `WHERE` clause continues with the limit check.
 */
const COUNT_IN_TODAYS_WINDOW = `ON CONFLICT(scope, budget_key) DO UPDATE SET
         window_start = excluded.window_start,
         count = CASE
           WHEN generation_budgets.window_start = excluded.window_start
             THEN generation_budgets.count + 1
           ELSE 1
         END
       WHERE generation_budgets.window_start != excluded.window_start`;

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
       ${COUNT_IN_TODAYS_WINDOW}
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
       SELECT ?1, ?7, ?2, 1
       WHERE NOT EXISTS (
         SELECT 1 FROM generation_budgets
         WHERE scope = ?3 AND budget_key = ?4
           AND window_start = ?2 AND count >= ?5
       )
       ${COUNT_IN_TODAYS_WINDOW}
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
      SERVICE_KEY,
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

/**
 * Today's production screenshots across the service and those the user
 * started (adding sites, regenerating pages), as a statement for the
 * dashboard's batch. Older windows count as zero.
 */
export function dashboardBudgetStatement(db: D1Queryable, userId: string) {
  return db
    .prepare(
      `SELECT scope, count FROM generation_budgets
       WHERE window_start = ?
         AND ((scope = 'production-global' AND budget_key = ?)
           OR (scope = 'production-client' AND budget_key = ?))`,
    )
    .bind(utcDayStart(), SERVICE_KEY, userClientKey(userId));
}

/** The dashboard's budget from `dashboardBudgetStatement`'s rows. */
export function dashboardBudget(
  rows: { scope: string; count: number }[],
  now = Date.now(),
): DashboardBudget {
  const used = (scope: BudgetScope) =>
    rows.find((row) => row.scope === scope)?.count ?? 0;
  const limits = DAILY_GENERATION_LIMITS.production;
  return {
    service: { used: used("production-global"), limit: limits.global },
    user: { used: used("production-client"), limit: limits.client },
    resets_at: utcDayStart(now) + DAY_MS,
  };
}
