#!/usr/bin/env bash
set -euo pipefail

export PATH="${HOME}/.bun/bin:${PATH}"

bun install --frozen-lockfile
bun run db:migrate:local
