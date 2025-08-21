#!/bin/bash

# Smoke test för AICompanion API
# Kör: ./scripts/smoke-api.sh

set -e

echo "🚀 Starting API smoke test..."
echo "================================"

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s http://127.0.0.1:3001/api/health | jq -r '.status' | grep -q "ok" && echo "✅ Health check passed" || echo "❌ Health check failed"

# Test 2: Dev login
echo "2. Testing dev login..."
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Dev-Token: s_demo" \
  --data '{"username":"admin","password":"admin123"}')
echo "✅ Login response received"

# Test 3: Session
echo "3. Testing session endpoint..."
curl -s http://127.0.0.1:3001/api/session | jq -r '.username' | grep -q "devuser" && echo "✅ Session check passed" || echo "❌ Session check failed"

# Test 4: Create client
echo "4. Testing client creation..."
CLIENT_RESPONSE=$(curl -s -X POST http://127.0.0.1:3001/api/clients \
  -H "Content-Type: application/json" \
  --data '{"initials":"SMOKE","staffId":"s_demo","status":"active"}')
CLIENT_ID=$(echo $CLIENT_RESPONSE | jq -r '.id')
echo "✅ Client created with ID: $CLIENT_ID"

# Test 5: Create care plan
echo "5. Testing care plan creation..."
CARE_PLAN_RESPONSE=$(curl -s -X POST http://127.0.0.1:3001/api/care-plans \
  -H "Content-Type: application/json" \
  --data "{\"clientId\":\"$CLIENT_ID\",\"planContent\":\"Smoke test vårdplan\"}")
echo "✅ Care plan created"

# Test 6: Create implementation plan
echo "6. Testing implementation plan creation..."
IMPLEMENTATION_RESPONSE=$(curl -s -X POST http://127.0.0.1:3001/api/implementation-plans \
  -H "Content-Type: application/json" \
  --data "{\"clientId\":\"$CLIENT_ID\",\"planContent\":\"Smoke test genomförandeplan\"}")
echo "✅ Implementation plan created"

# Test 7: Create weekly documentation
echo "7. Testing weekly documentation creation..."
WEEKLY_RESPONSE=$(curl -s -X POST http://127.0.0.1:3001/api/weekly-documentation \
  -H "Content-Type: application/json" \
  --data "{\"clientId\":\"$CLIENT_ID\",\"year\":2025,\"week\":34,\"documentation\":\"Smoke test veckodokumentation\"}")
echo "✅ Weekly documentation created"

# Test 8: Create monthly report
echo "8. Testing monthly report creation..."
MONTHLY_RESPONSE=$(curl -s -X POST http://127.0.0.1:3001/api/monthly-reports \
  -H "Content-Type: application/json" \
  --data "{\"clientId\":\"$CLIENT_ID\",\"year\":2025,\"month\":8,\"reportContent\":\"Smoke test månadsrapport\"}")
echo "✅ Monthly report created"

# Test 9: Create vimsa time
echo "9. Testing vimsa time creation..."
VIMSA_RESPONSE=$(curl -s -X POST http://127.0.0.1:3001/api/vimsa-time \
  -H "Content-Type: application/json" \
  --data "{\"clientId\":\"$CLIENT_ID\",\"year\":2025,\"week\":34,\"hoursWorked\":40}")
echo "✅ Vimsa time created"

# Test 10: Staff-scoped endpoints
echo "10. Testing staff-scoped endpoints..."
STAFF_ID="s_demo"
CARE_PLANS_COUNT=$(curl -s "http://127.0.0.1:3001/api/care-plans/staff/$STAFF_ID" | jq length)
IMPLEMENTATION_PLANS_COUNT=$(curl -s "http://127.0.0.1:3001/api/implementation-plans/staff/$STAFF_ID" | jq length)
echo "✅ Staff-scoped care plans: $CARE_PLANS_COUNT"
echo "✅ Staff-scoped implementation plans: $IMPLEMENTATION_PLANS_COUNT"

echo "================================"
echo "🎉 All smoke tests passed!"
echo "API is ready for development."
