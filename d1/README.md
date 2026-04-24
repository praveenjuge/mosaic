# D1 Database — Convex to D1 Migration

## Schema

The D1 schema lives in `d1/schema.sql`. Apply it with:

```bash
# Remote (production)
bunx wrangler d1 execute mosaic-prod --file d1/schema.sql

# Local development
bunx wrangler d1 execute mosaic-prod --local --file d1/schema.sql
```

## Data Migration Workflow

### 1. Export data from Convex

```bash
npx convex export --prod --path ~/Downloads/convex-export
```

This creates a directory with JSONL files for each table. The file we need is `sites.jsonl`.

### 2. Apply the D1 schema (if not already done)

```bash
# Remote
bunx wrangler d1 execute mosaic-prod --file d1/schema.sql

# Or local
bunx wrangler d1 execute mosaic-prod --local --file d1/schema.sql
```

### 3. Run the migration script

```bash
# Migrate to remote D1
bun run d1/migrate.ts --file ~/Downloads/convex-export/sites.jsonl --database mosaic-prod

# Migrate to local D1 (for development)
bun run d1/migrate.ts --file ~/Downloads/convex-export/sites.jsonl --database mosaic-prod --local
```

The script:
- Reads each line of the JSONL export
- Inserts sites using `INSERT OR IGNORE` (keyed on the `user_id, url_base` unique index)
- Inserts images from each site's `latest_images` array with duplicate checking
- Reports the number of sites and images processed

### 4. Verify the data

```bash
# Check site count
bunx wrangler d1 execute mosaic-prod --command "SELECT COUNT(*) FROM sites"

# Check image count
bunx wrangler d1 execute mosaic-prod --command "SELECT COUNT(*) FROM images"

# Spot-check a few rows
bunx wrangler d1 execute mosaic-prod --command "SELECT id, user_id, url_base, image_count FROM sites LIMIT 5"
```

Add `--local` to any command above to query the local database instead.

## Idempotency

The migration script is safe to run multiple times. Duplicate sites are skipped via the unique index on `(user_id, url_base)`, and duplicate images are skipped by checking for existing rows with the same `key` for a given site.
