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

# Real values set as environment variables in the cloud environment take
# precedence over .env.local, so placeholders only fill the gaps.
if [ ! -f .env.local ]; then
  cat > .env.local <<'ENV'
VITE_SITE_URL=http://localhost:3000
# Placeholder that decodes to a syntactically valid publishable key.
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZXhhbXBsZS5jb20k
CLERK_SECRET_KEY=sk_live_placeholder
ENV
fi

bun run db:migrate:local
bun run db:seed:local

# Cloud containers run as root, and Miniflare only launches the local
# Browser Run Chrome with --no-sandbox when CI is set. CI also keeps the Vite
# plugin on local bindings unless a Cloudflare API token is configured.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export CI=1" >> "$CLAUDE_ENV_FILE"
fi
