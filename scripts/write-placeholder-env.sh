#!/usr/bin/env bash
# Writes placeholder site and Clerk values to .env.local when it is missing,
# so build, dev, and tests run without real credentials. Values set in the
# environment take precedence over .env.local, so real keys still win.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  exit 0
fi

# Clerk publishable keys are "pk_<instance>_" + base64("<frontend API>$").
# The pk_live_ shape skips Clerk's development handshake redirect, and the
# reserved .invalid domain never resolves. The key is assembled here rather
# than committed so secret scanners don't mistake it for a real credential.
frontend_api=$(printf 'clerk.invalid$' | base64)

cat > .env.local <<ENV
VITE_SITE_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_live_${frontend_api}
CLERK_SECRET_KEY=clerk-secret-placeholder
ENV
