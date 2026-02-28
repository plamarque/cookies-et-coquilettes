#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Detect local IP for network access (phone, tablet, etc.)
get_local_ip() {
  if [[ "$(uname)" == "Darwin" ]]; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost"
  else
    hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost"
  fi
}

LOCAL_IP=$(get_local_ip)

cleanup() {
  if [ -n "${BFF_PID:-}" ] && kill -0 "$BFF_PID" 2>/dev/null; then
    kill "$BFF_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting BFF on http://localhost:8787 ..."
npm run dev:bff &
BFF_PID=$!

# Wait for BFF to be ready
sleep 2

echo "Starting web app on http://localhost:5173 ..."
echo ""
echo "  Local:   http://localhost:5173"
echo "  Network: http://${LOCAL_IP}:5173"
echo ""
echo "  BFF API: http://${LOCAL_IP}:8787"
echo "  (Use this URL from your phone — ensure same WiFi)"
echo ""

# Override VITE_BFF_URL so the frontend calls the BFF via network IP (required for phone access)
export VITE_BFF_URL="http://${LOCAL_IP}:8787"
npm run dev:web
