#!/usr/bin/env bash
# SessionStart hook for Claude Code cloud sessions (see .claude/settings.json).
# Installs dependencies, writes placeholder env values, and prepares local D1
# so build, dev, and tests work without Cloudflare or Clerk credentials.
# Local sessions skip it: your own machine is already set up.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}"

bun install --frozen-lockfile

bash scripts/write-placeholder-env.sh

bun run db:migrate:local
bun run db:seed:local

# Cloud containers run as root, and Miniflare only launches the local
# Browser Run Chrome with --no-sandbox when CI is set. CI also keeps the Vite
# plugin on local bindings unless a Cloudflare API token is configured.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export CI=1" >> "$CLAUDE_ENV_FILE"
fi
