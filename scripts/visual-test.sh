#!/usr/bin/env bash
# Runs the visual regression specs (e2e/visual.spec.ts) inside the pinned
# Playwright image, so baselines match in Claude Code cloud sessions, on
# developer machines, and in CI. Extra arguments go to `playwright test`:
#   bash scripts/visual-test.sh                      # compare
#   bash scripts/visual-test.sh --update-snapshots   # rewrite baselines
# The dev server runs inside the container with placeholder Clerk keys, so
# real keys in .env.local don't change the signed-out header.
set -euo pipefail

cd "$(dirname "$0")/.."

# Keep in step with @playwright/test in package.json. CI's visual job reads
# this line to start pulling the image early.
image="mcr.microsoft.com/playwright:v1.64.1-noble"

# The container reuses the host's bun binary and node_modules (workerd,
# esbuild), which only run there when the host is Linux too.
if [ "$(uname -s)" != "Linux" ]; then
  echo "Visual tests need a Linux host; CI and Claude Code cloud sessions run them." >&2
  exit 1
fi

if ! docker info > /dev/null 2>&1; then
  # Claude Code cloud containers ship Docker without a running daemon.
  if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && [ "$(id -u)" = "0" ]; then
    echo "Starting dockerd..." >&2
    dockerd > "${TMPDIR:-/tmp}/dockerd.log" 2>&1 &
    for _ in $(seq 1 30); do
      docker info > /dev/null 2>&1 && break
      sleep 1
    done
  fi
  if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running; start it and retry." >&2
    exit 1
  fi
fi

# Resolve symlinks (setup-bun links its binary) so the mount gets the file.
bun_path=$(readlink -f "$(command -v bun)")
env_file=$(mktemp)
trap 'rm -f "$env_file"' EXIT
rm -f "$env_file"
bash scripts/write-placeholder-env.sh "$env_file"
cat >> "$env_file" <<ENV
CI=1
MOSAIC_VISUAL=1
MOSAIC_REMOTE_BINDINGS=0
HOME=/tmp
ENV

docker run --rm --init --ipc=host \
  --user "$(id -u):$(id -g)" \
  --env-file "$env_file" \
  -v "$PWD":/work -w /work \
  -v "$bun_path":/usr/local/bin/bun:ro \
  -v "$bun_path":/usr/local/bin/bunx:ro \
  "$image" \
  bun run playwright test --project=visual "$@"
