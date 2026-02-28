#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PORT=4174
BASE_PATH="/"
PREVIEW_URL="http://localhost:${PORT}/"

echo "Building web app for E2E..."
VITE_BASE_PATH="$BASE_PATH" npm run build:web

echo "Stopping any existing preview on port ${PORT}..."
lsof -ti:"${PORT}" | xargs kill -9 2>/dev/null || true
sleep 1

echo "Starting preview server..."
VITE_BASE_PATH="$BASE_PATH" npm run preview -w @cookies-et-coquilettes/web -- --host 127.0.0.1 --port "${PORT}" --strictPort &
PREVIEW_PID=$!

cleanup() {
  kill "${PREVIEW_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Waiting for preview server..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" "${PREVIEW_URL}" | grep -q 200; then
    echo "Preview server ready."
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "Preview failed to start in time."
    exit 1
  fi
done

echo "Running Playwright tests..."
REUSE_SERVER=1 npx playwright test
