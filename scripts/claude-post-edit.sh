#!/usr/bin/env bash
# PostToolUse hook for Claude Code (see .claude/settings.json). Formats the
# file Claude just edited with Prettier, and regenerates binding types when
# wrangler.jsonc changes, so format:check and cf-typegen:check stay green.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}"

file=$(bun -e 'const input = await Bun.stdin.json();
console.log(input.tool_input?.file_path ?? "");')
if [ -z "$file" ] || [ ! -f "$file" ]; then
  exit 0
fi

# Prettier skips ignored and unsupported files on its own.
bunx prettier --write --ignore-unknown --log-level warn "$file" >&2

if [ "$(basename "$file")" = "wrangler.jsonc" ]; then
  bun run --silent cf-typegen >&2
fi
