#!/usr/bin/env bash
set -euo pipefail

# ==== clean up ====
kill -9 $(lsof -ti tcp:3001) 2>/dev/null || true
kill -9 $(lsof -ti tcp:5175) 2>/dev/null || true
pkill -f "vite|tsx|node.*server/index" 2>/dev/null || true

# ==== go to project ====
cd "/Users/mirzacelik/Downloads/AICompanion-5"

# ==== start API in background ====
( npm run dev:api > /tmp/api.log 2>&1 & echo $! > /tmp/api.pid ) || true
sleep 1

# ==== wait for API ====
BASE="http://127.0.0.1:3001"
for i in {1..60}; do
  if curl -fsS "$BASE/api/health" >/dev/null; then echo "API is up"; break; fi
  sleep 0.5
  if [ "$i" -eq 60 ]; then echo "API failed to start"; exit 1; fi
done

# ==== dev login with fixed token s_demo ====
JAR="/tmp/cookies.jar"; rm -f "$JAR"
curl -sS -c "$JAR" -b "$JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Dev-Token: s_demo" \
  --data '{"username":"admin","password":"admin123"}' >/dev/null

# ==== create a client ====
curl -sS -c "$JAR" -b "$JAR" -X POST "$BASE/api/clients" \
  -H "Content-Type: application/json" \
  --data '{"initials":"ZZ","staffId":"s_demo","status":"active"}' \
  -D /tmp/post_client.h -o /tmp/post_client.b

CID=$(sed -n 's/.*\"id\":\"\([^\"]\+\)\".*/\1/p' /tmp/post_client.b)
if [ -z "${CID:-}" ]; then
  CID=$(cat /tmp/post_client.b | sed -E 's/.*"id":"?([^",}]+).*/\1/')
fi

# ==== create care plan ====
curl -sS -c "$JAR" -b "$JAR" -X POST "$BASE/api/care-plans" \
  -H "Content-Type: application/json" \
  -H "X-Dev-Token: s_demo" \
  --data '{"clientId":"'"$CID"'","planContent":"Test care plan"}' \
  -D /tmp/post_careplan.h -o /tmp/post_careplan.b

# ==== create implementation plan ====
curl -sS -c "$JAR" -b "$JAR" -X POST "$BASE/api/implementation-plans" \
  -H "Content-Type: application/json" \
  -H "X-Dev-Token: s_demo" \
  --data '{"clientId":"'"$CID"'","planContent":"Test implementation"}' \
  -D /tmp/post_implplan.h -o /tmp/post_implplan.b

# ==== verify staff-scoped GETs ====
curl -sS -c "$JAR" -b "$JAR" -H "X-Dev-Token: s_demo" "$BASE/api/care-plans/staff/s_demo" \
  -o /tmp/get_careplans.json || true
curl -sS -c "$JAR" -b "$JAR" -H "X-Dev-Token: s_demo" "$BASE/api/implementation-plans/staff/s_demo" \
  -o /tmp/get_implplans.json || true

# ==== print results ====
echo "POST /api/clients ->"; head -n 1 /tmp/post_client.h || true; echo; cat /tmp/post_client.b || true; echo; echo

echo "POST /api/care-plans ->"; head -n 1 /tmp/post_careplan.h || true; echo; cat /tmp/post_careplan.b || true; echo; echo

echo "POST /api/implementation-plans ->"; head -n 1 /tmp/post_implplan.h || true; echo; cat /tmp/post_implplan.b || true; echo; echo

echo "GET /api/care-plans/staff/s_demo ->"; cat /tmp/get_careplans.json || true; echo; echo

echo "GET /api/implementation-plans/staff/s_demo ->"; cat /tmp/get_implplans.json || true; echo; echo
