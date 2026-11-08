import type { D1Queryable } from "@/server/db";
import { Database, type SQLQueryBindings } from "bun:sqlite";
import { join } from "node:path";

const migrationsDir = join(import.meta.dir, "../../migrations");
const migrationFiles = [
  ...new Bun.Glob("*.sql").scanSync({ cwd: migrationsDir }),
].sort();

/**
 * A fresh in-memory database with every migration applied, and just enough
 * of D1's API over it to run Mosaic's queries. `sqlite` sets up and reads
 * rows directly.
 */
export async function createTestD1(): Promise<{
  db: D1Queryable & D1Database;
  sqlite: Database;
}> {
  const sqlite = new Database(":memory:");
  for (const file of migrationFiles) {
    sqlite.exec(await Bun.file(join(migrationsDir, file)).text());
  }
  const statement = (sql: string, params: SQLQueryBindings[] = []) => ({
    sql,
    params,
    bind: (...values: SQLQueryBindings[]) => statement(sql, values),
    all: async () => ({ results: sqlite.query(sql).all(...params) }),
    first: async () => sqlite.query(sql).get(...params),
    run: async () => ({ meta: { changes: sqlite.run(sql, params).changes } }),
  });
  const db = {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: ReturnType<typeof statement>[]) =>
      sqlite.transaction(() =>
        statements.map(({ sql, params }) => ({
          results: sqlite.query(sql).all(...params),
        })),
      )(),
    withSession: () => db,
  };
  return { db: db as unknown as D1Queryable & D1Database, sqlite };
}
