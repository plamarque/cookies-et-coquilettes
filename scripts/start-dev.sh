#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

cleanup() {
  if [ -n "${BFF_PID:-}" ] && kill -0 "$BFF_PID" 2>/dev/null; then
    kill "$BFF_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting BFF on http://localhost:8787 ..."
npm run dev:bff &
BFF_PID=$!

echo "Starting web app on http://localhost:5173 ..."
npm run dev:web
