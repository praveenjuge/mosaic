import { utcDayStart } from "@/lib/utils";
import { createTestD1 } from "@/testing/d1";
import type { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import {
  DAILY_GENERATION_LIMITS,
  dashboardBudget,
  dashboardBudgetStatement,
  reserveGeneration,
  userClientKey,
} from "./generation-usage";

let db: Awaited<ReturnType<typeof createTestD1>>["db"];
let sqlite: Database;

beforeEach(async () => {
  ({ db, sqlite } = await createTestD1());
});

async function reserveTimes(count: number, client: string) {
  const results: boolean[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await reserveGeneration(db, "demo", client));
  }
  return results;
}

async function readBudget(userId: string) {
  const { results } = await dashboardBudgetStatement(db, userId).all<{
    scope: string;
    count: number;
  }>();
  return dashboardBudget(results);
}

describe("reserveGeneration", () => {
  const { client: clientLimit, global: globalLimit } =
    DAILY_GENERATION_LIMITS.demo;

  test("stops a client at its daily limit without spending the service's", async () => {
    const results = await reserveTimes(clientLimit + 2, "1.2.3.4");
    expect(results.filter(Boolean)).toHaveLength(clientLimit);
    expect(results.slice(-2)).toEqual([false, false]);
    expect(await reserveGeneration(db, "demo", "5.6.7.8")).toBe(true);

    const service = sqlite
      .query("SELECT count FROM generation_budgets WHERE scope = 'demo-global'")
      .get() as { count: number };
    expect(service.count).toBe(clientLimit + 1);
  });

  test("refunds the client when the service's budget is spent", async () => {
    sqlite.run(
      `INSERT INTO generation_budgets (scope, budget_key, window_start, count)
       VALUES ('demo-global', 'service', ?, ?)`,
      [utcDayStart(), globalLimit],
    );

    expect(await reserveGeneration(db, "demo", "1.2.3.4")).toBe(false);
    const client = sqlite
      .query("SELECT count FROM generation_budgets WHERE scope = 'demo-client'")
      .get() as { count: number } | null;
    expect(client?.count ?? 0).toBe(0);
  });
});

describe("dashboard budget", () => {
  test("reads today's service count and the user's own screenshots", async () => {
    const limits = DAILY_GENERATION_LIMITS.production;
    await reserveGeneration(db, "production", userClientKey("user_a"));
    await reserveGeneration(db, "production", userClientKey("user_a"));
    await reserveGeneration(db, "production", userClientKey("user_b"));
    await reserveGeneration(db, "production", "1.2.3.4");

    const budget = await readBudget("user_a");
    expect(budget.service).toEqual({ used: 4, limit: limits.global });
    expect(budget.user).toEqual({ used: 2, limit: limits.client });
    expect(budget.resets_at).toBeGreaterThan(Date.now());
    expect(budget.resets_at - Date.now()).toBeLessThanOrEqual(86_400_000);
  });

  test("counts nothing before the first screenshot of the day", async () => {
    const budget = await readBudget("user_a");
    expect(budget.service.used).toBe(0);
    expect(budget.user.used).toBe(0);
  });
});
