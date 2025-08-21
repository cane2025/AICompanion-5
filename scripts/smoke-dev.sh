#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:3001"
JAR="/tmp/cookies.jar"

echo "== Clean ports =="
kill -9 $(lsof -ti tcp:3001) 2>/dev/null || true
kill -9 $(lsof -ti tcp:5175) 2>/dev/null || true
pkill -f "vite|tsx|node.*server/index" 2>/dev/null || true

echo "== Install deps (once) =="
npm install

echo "== Start API =="
npm run dev:api > /tmp/api.log 2>&1 & echo $! > /tmp/api.pid

echo "== Wait for health =="
for i in {1..40}; do
  curl -fsS "$BASE/api/health" >/dev/null && echo "API is up" && break
  sleep 0.5
done

echo "== Dev login (fixed token) =="
rm -f "$JAR"
curl -sS -c "$JAR" -b "$JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Dev-Token: s_demo" \
  --data '{"username":"admin","password":"admin123"}' >/dev/null

echo "== Create client =="
CID=$(curl -sS -c "$JAR" -b "$JAR" -X POST "$BASE/api/clients" \
  -H "Content-Type: application/json" \
  --data '{"initials":"ZZ","staffId":"s_demo","status":"active"}' \
  | sed -E 's/.*"id":"?([^",}]+)".*/\1/')
echo "Client id: $CID"

echo "== Create care plan =="
curl -fsS -c "$JAR" -b "$JAR" -X POST "$BASE/api/care-plans" \
  -H "Content-Type: application/json" -H "X-Dev-Token: s_demo" \
  --data "{\"clientId\":\"$CID\",\"planContent\":\"Test care plan\"}" >/dev/null

echo "== Create implementation plan =="
curl -fsS -c "$JAR" -b "$JAR" -X POST "$BASE/api/implementation-plans" \
  -H "Content-Type: application/json" -H "X-Dev-Token: s_demo" \
  --data "{\"clientId\":\"$CID\",\"planContent\":\"Test implementation\"}" >/dev/null

echo "== Staff scoped checks =="
echo "- Care plans:" &&
curl -sS -c "$JAR" -b "$JAR" -H "X-Dev-Token: s_demo" \
  "$BASE/api/care-plans/staff/s_demo" | sed 's/},{/},\n{/g'
echo
echo "- Implementation plans:" &&
curl -sS -c "$JAR" -b "$JAR" -H "X-Dev-Token: s_demo" \
  "$BASE/api/implementation-plans/staff/s_demo" | sed 's/},{/},\n{/g'

echo "== Start client (separat) =="
echo "Öppna en ny terminal och kör: npm run dev:client"
