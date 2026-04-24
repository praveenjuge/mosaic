#!/usr/bin/env bun
/**
 * Convex → D1 Migration Script
 *
 * Reads a Convex JSONL export of the `sites` table and inserts rows into
 * the D1 `sites` and `images` tables via `wrangler d1 execute`.
 *
 * Usage:
 *   bun run d1/migrate.ts --file ~/Downloads/convex-export/sites.jsonl --database mosaic-prod [--local]
 *
 * Flags:
 *   --file      Path to the Convex JSONL export file
 *   --database  D1 database name (as configured in wrangler.jsonc)
 *   --local     Target the local D1 database instead of remote
 */

import { parseArgs } from "util";

// ── CLI argument parsing ────────────────────────────────────────────

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    file: { type: "string" },
    database: { type: "string" },
    local: { type: "boolean", default: false },
    remote: { type: "boolean", default: false },
  },
  strict: true,
});

if (!values.file || !values.database) {
  console.error("Usage: bun run d1/migrate.ts --file <path> --database <name> [--local]");
  process.exit(1);
}

const filePath = values.file;
const dbName = values.database;
const isLocal = values.local ?? false;
const isRemote = values.remote ?? false;

// ── Types for Convex export rows ────────────────────────────────────

interface ConvexSiteRow {
  _id: string;
  _creationTime: number;
  user_id: string;
  url_base: string;
  image_count: number;
  r2_prefix?: string;
  latest_images?: Array<{
    key: string;
    page_url: string;
    size_in_bytes: number;
    generated_at: number;
  }>;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Convert epoch milliseconds to ISO 8601 string (UTC). */
function epochMsToIso(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").replace("Z", "");
}

/** Escape single quotes for SQL string literals. */
function esc(value: string): string {
  return value.replace(/'/g, "''");
}

/** Execute a SQL command against D1 via wrangler. */
async function execSql(sql: string): Promise<void> {
  const args = ["bunx", "wrangler", "d1", "execute", dbName];
  if (isLocal) args.push("--local");
  if (isRemote) args.push("--remote");
  args.push("--command", sql);

  const result = Bun.spawnSync(args, {
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString();
    throw new Error(`wrangler d1 execute failed (exit ${result.exitCode}):\n${stderr}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading JSONL export from: ${filePath}`);
  console.log(`Target D1 database: ${dbName}${isLocal ? " (local)" : ""}`);
  console.log();

  const file = Bun.file(filePath);
  const text = await file.text();
  const lines = text.trim().split("\n").filter(Boolean);

  console.log(`Found ${lines.length} site records in export.`);

  let sitesInserted = 0;
  let imagesInserted = 0;

  for (const line of lines) {
    const row: ConvexSiteRow = JSON.parse(line);

    // Map _creationTime (epoch ms) to ISO 8601 for created_at
    const createdAt = epochMsToIso(row._creationTime);

    // Older sites don't have r2_prefix — they used the Convex _id as the prefix
    const r2Prefix = row.r2_prefix || row._id;

    // INSERT OR IGNORE keyed on the (user_id, url_base) unique index
    const siteSql = [
      `INSERT OR IGNORE INTO sites (user_id, url_base, image_count, r2_prefix, created_at)`,
      `VALUES ('${esc(row.user_id)}', '${esc(row.url_base)}', ${row.image_count}, '${esc(r2Prefix)}', '${esc(createdAt)}')`,
    ].join(" ");

    await execSql(siteSql);
    sitesInserted++;

    // Insert images from latest_images array
    if (row.latest_images && row.latest_images.length > 0) {
      for (const img of row.latest_images) {
        // Look up the site_id by user_id + url_base, then insert the image
        // Using a subquery to resolve the foreign key
        const imgSql = [
          `INSERT OR IGNORE INTO images (site_id, key, page_url, size_in_bytes, generated_at)`,
          `SELECT s.id, '${esc(img.key)}', '${esc(img.page_url)}', ${img.size_in_bytes}, ${img.generated_at}`,
          `FROM sites s`,
          `WHERE s.user_id = '${esc(row.user_id)}' AND s.url_base = '${esc(row.url_base)}'`,
          `AND NOT EXISTS (`,
          `  SELECT 1 FROM images i WHERE i.site_id = s.id AND i.key = '${esc(img.key)}'`,
          `)`,
        ].join(" ");

        await execSql(imgSql);
        imagesInserted++;
      }
    }
  }

  console.log();
  console.log("Migration complete!");
  console.log(`  Sites processed:  ${sitesInserted}`);
  console.log(`  Images processed: ${imagesInserted}`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
