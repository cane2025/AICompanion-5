#!/bin/bash

# Production Smoke Test Script
# Verifies all endpoints work correctly after deployment

set -e

# Configuration
BASE_URL="${PROD_URL:-http://localhost:3001}"
TEST_CLIENT="c_001"

echo "🧪 Production Smoke Test"
echo "========================"
echo "Testing URL: $BASE_URL"
echo "Test Client: $TEST_CLIENT"
echo ""

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo "-----------------------"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo "✅ Health check passed (200)"
else
    echo "❌ Health check failed ($HEALTH_STATUS)"
    exit 1
fi

# Test 2: Care Plans CRUD
echo ""
echo "📋 Test 2: Care Plans CRUD"
echo "--------------------------"

echo "Creating care plan..."
CARE_PLAN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$TEST_CLIENT\",\"title\":\"Smoke Test Care Plan\",\"goals\":\"Test production functionality\",\"status\":\"active\"}" \
  "$BASE_URL/api/care-plans")

CARE_PLAN_ID=$(echo "$CARE_PLAN_RESPONSE" | jq -r '.id')
if [ "$CARE_PLAN_ID" != "null" ] && [ "$CARE_PLAN_ID" != "" ]; then
    echo "✅ Care plan created with ID: $CARE_PLAN_ID"
else
    echo "❌ Failed to create care plan"
    echo "Response: $CARE_PLAN_RESPONSE"
    exit 1
fi

echo "Listing care plans..."
CARE_PLANS_COUNT=$(curl -s "$BASE_URL/api/care-plans/client/$TEST_CLIENT" | jq 'length')
if [ "$CARE_PLANS_COUNT" -gt 0 ]; then
    echo "✅ Found $CARE_PLANS_COUNT care plans"
else
    echo "❌ No care plans found"
    exit 1
fi

echo "Updating care plan..."
UPDATE_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Care Plan - Updated","goals":"Test production functionality - updated"}' \
  "$BASE_URL/api/care-plans/$CARE_PLAN_ID")

UPDATED_VERSION=$(echo "$UPDATE_RESPONSE" | jq -r '.version')
if [ "$UPDATED_VERSION" -eq 2 ]; then
    echo "✅ Care plan updated, version: $UPDATED_VERSION"
else
    echo "❌ Failed to update care plan"
    echo "Response: $UPDATE_RESPONSE"
    exit 1
fi

echo "Deleting care plan..."
DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/care-plans/$CARE_PLAN_ID")
if [ "$DELETE_STATUS" -eq 204 ]; then
    echo "✅ Care plan deleted (204)"
else
    echo "❌ Failed to delete care plan ($DELETE_STATUS)"
    exit 1
fi

# Test 3: Implementation Plans CRUD
echo ""
echo "📋 Test 3: Implementation Plans CRUD"
echo "------------------------------------"

echo "Creating implementation plan..."
GFP_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$TEST_CLIENT\",\"title\":\"Smoke Test GFP\",\"actions\":\"Test production functionality\",\"status\":\"planned\"}" \
  "$BASE_URL/api/implementation-plans")

GFP_ID=$(echo "$GFP_RESPONSE" | jq -r '.id')
if [ "$GFP_ID" != "null" ] && [ "$GFP_ID" != "" ]; then
    echo "✅ Implementation plan created with ID: $GFP_ID"
else
    echo "❌ Failed to create implementation plan"
    echo "Response: $GFP_RESPONSE"
    exit 1
fi

echo "Listing implementation plans..."
GFP_COUNT=$(curl -s "$BASE_URL/api/implementation-plans/client/$TEST_CLIENT" | jq 'length')
if [ "$GFP_COUNT" -gt 0 ]; then
    echo "✅ Found $GFP_COUNT implementation plans"
else
    echo "❌ No implementation plans found"
    exit 1
fi

echo "Updating implementation plan..."
GFP_UPDATE_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test GFP - Updated","actions":"Test production functionality - updated","status":"in_progress"}' \
  "$BASE_URL/api/implementation-plans/$GFP_ID")

GFP_UPDATED_VERSION=$(echo "$GFP_UPDATE_RESPONSE" | jq -r '.version')
if [ "$GFP_UPDATED_VERSION" -eq 2 ]; then
    echo "✅ Implementation plan updated, version: $GFP_UPDATED_VERSION"
else
    echo "❌ Failed to update implementation plan"
    echo "Response: $GFP_UPDATE_RESPONSE"
    exit 1
fi

echo "Deleting implementation plan..."
GFP_DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/implementation-plans/$GFP_ID")
if [ "$GFP_DELETE_STATUS" -eq 204 ]; then
    echo "✅ Implementation plan deleted (204)"
else
    echo "❌ Failed to delete implementation plan ($GFP_DELETE_STATUS)"
    exit 1
fi

# Test 4: WeeklyDocs CRUD
echo ""
echo "📋 Test 4: WeeklyDocs CRUD"
echo "--------------------------"

TEST_WEEK="2025-01-27"

echo "Creating weekly document..."
WEEKLY_DOC_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$TEST_CLIENT\",\"weekStartISO\":\"$TEST_WEEK\"}" \
  "$BASE_URL/api/weekly-docs")

WEEKLY_DOC_ID=$(echo "$WEEKLY_DOC_RESPONSE" | jq -r '.id')
if [ "$WEEKLY_DOC_ID" != "null" ] && [ "$WEEKLY_DOC_ID" != "" ]; then
    echo "✅ Weekly document created with ID: $WEEKLY_DOC_ID"
else
    echo "❌ Failed to create weekly document"
    echo "Response: $WEEKLY_DOC_RESPONSE"
    exit 1
fi

echo "Adding entry to weekly document..."
ENTRY_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"dateISO\":\"$TEST_WEEK\",\"category\":\"Skola\",\"hours\":6,\"notes\":\"Smoke test entry\",\"mood\":4}" \
  "$BASE_URL/api/weekly-docs/$WEEKLY_DOC_ID/entries")

ENTRY_ID=$(echo "$ENTRY_RESPONSE" | jq -r '.id')
if [ "$ENTRY_ID" != "null" ] && [ "$ENTRY_ID" != "" ]; then
    echo "✅ Entry added with ID: $ENTRY_ID"
else
    echo "❌ Failed to add entry"
    echo "Response: $ENTRY_RESPONSE"
    exit 1
fi

echo "Listing weekly document..."
DOC_ENTRIES=$(curl -s "$BASE_URL/api/weekly-docs/client/$TEST_CLIENT?week=$TEST_WEEK" | jq '.[0].entries | length')
if [ "$DOC_ENTRIES" -eq 1 ]; then
    echo "✅ Found $DOC_ENTRIES entries in weekly document"
else
    echo "❌ Expected 1 entry, found $DOC_ENTRIES"
    exit 1
fi

echo "Updating entry..."
ENTRY_UPDATE_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"hours":7,"notes":"Smoke test entry - updated","mood":5}' \
  "$BASE_URL/api/weekly-docs/$WEEKLY_DOC_ID/entries/$ENTRY_ID")

UPDATED_HOURS=$(echo "$ENTRY_UPDATE_RESPONSE" | jq -r '.hours')
if [ "$UPDATED_HOURS" -eq 7 ]; then
    echo "✅ Entry updated, hours: $UPDATED_HOURS"
else
    echo "❌ Failed to update entry"
    echo "Response: $ENTRY_UPDATE_RESPONSE"
    exit 1
fi

echo "Deleting entry..."
ENTRY_DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/weekly-docs/$WEEKLY_DOC_ID/entries/$ENTRY_ID")
if [ "$ENTRY_DELETE_STATUS" -eq 204 ]; then
    echo "✅ Entry deleted (204)"
else
    echo "❌ Failed to delete entry ($ENTRY_DELETE_STATUS)"
    exit 1
fi

echo "Deleting weekly document..."
DOC_DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/weekly-docs/$WEEKLY_DOC_ID")
if [ "$DOC_DELETE_STATUS" -eq 204 ]; then
    echo "✅ Weekly document deleted (204)"
else
    echo "❌ Failed to delete weekly document ($DOC_DELETE_STATUS)"
    exit 1
fi

# Final summary
echo ""
echo "🎉 Production Smoke Test Summary"
echo "================================"
echo "✅ Health check: PASSED"
echo "✅ Care Plans CRUD: PASSED"
echo "✅ Implementation Plans CRUD: PASSED"
echo "✅ WeeklyDocs CRUD: PASSED"
echo ""
echo "🚀 All tests passed! Production deployment is working correctly."
echo ""
echo "📋 Next steps:"
echo "1. Monitor application logs for any errors"
echo "2. Check error rates for 4xx/5xx responses"
echo "3. Verify UI functionality in browser"
echo "4. Run full E2E tests if needed"
