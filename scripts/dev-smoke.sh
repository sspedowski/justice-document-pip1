#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3020}"
TIMEOUT="${TIMEOUT:-120}"

header(){ echo -e "\n=== $1 ==="; }

header "Node"
if command -v node >/dev/null 2>&1; then node -v || true; else echo "Node not found in PATH. Install Node 20 LTS." >&2; fi

header "Install"
if [ -f package-lock.json ]; then echo "Lockfile present -> npm ci"; npm ci; else echo "No lockfile -> npm install"; npm install; fi

header "Start dev"
PORT="$PORT" npm run dev >/tmp/dev.out 2>&1 &
DEV_PID=$!
sleep 0.5

header "Wait for server"
deadline=$((SECONDS+TIMEOUT)); ok=0
while [ $SECONDS -lt $deadline ]; do
  if curl -sSf "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then ok=1; break; fi
  sleep 0.5
done
if [ $ok -ne 1 ]; then echo "Server did not become healthy within ${TIMEOUT}s" >&2; kill $DEV_PID >/dev/null 2>&1 || true; exit 1; fi
echo "Health endpoint returned 200."

header "Probes"
curl -s -i "http://localhost:${PORT}/" | sed -n '1,10p'
curl -s -i "http://localhost:${PORT}/dashboard" | sed -n '1,10p'
curl -s -i "http://localhost:${PORT}/dashboard/" | sed -n '1,10p'
echo; echo -n "/api/health -> "; curl -s "http://localhost:${PORT}/api/health"; echo
echo -n "/api/rtdb/ping -> "; curl -s "http://localhost:${PORT}/api/rtdb/ping"; echo

header "Stop dev"
kill $DEV_PID >/dev/null 2>&1 || true
echo "Stopped dev server (PID $DEV_PID)."
echo -e "\nSmoke test complete."
