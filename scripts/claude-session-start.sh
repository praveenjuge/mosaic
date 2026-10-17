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

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  # Cloud containers run as root, and Miniflare only launches the local
  # Browser Run Chrome with --no-sandbox when CI is set.
  echo "export CI=1" >> "$CLAUDE_ENV_FILE"

  # A CLOUDFLARE_API_TOKEN in the environment turns remote bindings on, but
  # the remote proxy can't pass Cloudflare Access on the account's workers.dev
  # subdomain without a service token, and then `bun run dev` fails to start.
  # Keep dev on local Chrome unless the session can authenticate to Access or
  # the environment sets MOSAIC_REMOTE_BINDINGS explicitly.
  if [ -z "${MOSAIC_REMOTE_BINDINGS:-}" ] &&
    [ -z "${CLOUDFLARE_ACCESS_CLIENT_ID:-}" ]; then
    echo "export MOSAIC_REMOTE_BINDINGS=0" >> "$CLAUDE_ENV_FILE"
  fi
fi
