---
name: new-migration
description: Add a D1 schema change to Mosaic as a new Wrangler migration, apply it locally, and cover it with tests. Use whenever a change needs a new table, column, index, or data backfill in D1.
---

# Add a D1 migration

1. Create the file with the next number; never edit an existing migration:

   ```sh
   bunx wrangler d1 migrations create DB <snake_case_description>
   ```

   It lands in `migrations/` as `NNNN_<description>.sql`.

2. Write SQLite that D1 accepts:
   - Comment why the change exists, like `0002_security_controls.sql` does.
   - Backfill existing rows in the same migration when a new column needs data.
   - Prefer additive changes (new column with a default, new table). Renames
     and drops break the deployed Worker between migration and deploy, because
     `bun run deploy` migrates first.

3. Apply and check locally:

   ```sh
   bun run db:migrate:local
   bunx wrangler d1 execute DB --local --command "PRAGMA table_info(<table>)"
   ```

   If `/use` needs new seed data, update `scripts/seed-local.sql` and keep it
   idempotent (`WHERE NOT EXISTS`).

4. Update the code:
   - Types in `src/lib/types.ts`.
   - Queries take a `D1Queryable` and use `.bind()` parameters, never string
     interpolation; user data stays scoped to Clerk's `userId`.

5. Test: unit tests in `src/`, and an integration test in
   `tests/integration/` when behavior depends on the schema
   (`bun run build && bun run test:integration`; the harness applies
   migrations itself).

6. In the PR description, say that a human must run `bun run db:migrate:preview`
   for Worker Previews; production migrations run as part of `bun run deploy`.
   Agents are not allowed to run remote migrations.
