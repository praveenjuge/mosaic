import { env } from "cloudflare:workers";

/**
 * The query surface shared by `D1Database` and `D1DatabaseSession`, so
 * helpers work with either a plain binding or a Sessions API session.
 */
export type D1Queryable = Pick<D1Database, "prepare">;

export function getDb(): D1Database {
  return env.DB;
}
