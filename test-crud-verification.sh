#!/bin/bash

echo "🧪 CRUD Verification Test Script"
echo "================================="

# Test 1: Health check
echo "📝 Test 1: Health check..."
curl -s http://127.0.0.1:3001/api/health | jq '.'
echo ""

# Test 2: Get initial counts and IDs
echo "📝 Test 2: Get initial counts and IDs..."
CARE_PLANS_INITIAL=$(curl -s http://127.0.0.1:3001/api/care-plans/all | jq 'length')
GFP_INITIAL=$(curl -s http://127.0.0.1:3001/api/implementation-plans/all | jq 'length')

echo "Initial care plans: $CARE_PLANS_INITIAL"
echo "Initial GFP: $GFP_INITIAL"

# Get first care plan ID for deletion test
CARE_PLAN_ID_TO_DELETE=$(curl -s http://127.0.0.1:3001/api/care-plans/all | jq -r '.[0].id')
echo "Care plan ID to delete: $CARE_PLAN_ID_TO_DELETE"

# Get first GFP ID for deletion test  
GFP_ID_TO_DELETE=$(curl -s http://127.0.0.1:3001/api/implementation-plans/all | jq -r '.[0].id')
echo "GFP ID to delete: $GFP_ID_TO_DELETE"
echo ""

# Test 3: Create care plan
echo "📝 Test 3: Create care plan..."
CARE_PLAN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"clientId":"c_test","staffId":"s_test","planContent":"Test plan","status":"received"}' \
  http://127.0.0.1:3001/api/care-plans)
CARE_PLAN_ID=$(echo $CARE_PLAN_RESPONSE | jq -r '.id')
echo "Created care plan: $CARE_PLAN_ID"
echo ""

# Test 4: Update care plan
echo "📝 Test 4: Update care plan..."
curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"status":"in_progress","comment":"Updated"}' \
  http://127.0.0.1:3001/api/care-plans/$CARE_PLAN_ID | jq '.status, .comment'
echo ""

# Test 5: Create GFP
echo "📝 Test 5: Create GFP..."
GFP_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"clientId":"c_test","staffId":"s_test","planContent":"Test GFP","status":"pending"}' \
  http://127.0.0.1:3001/api/implementation-plans)
GFP_ID=$(echo $GFP_RESPONSE | jq -r '.id')
echo "Created GFP: $GFP_ID"
echo ""

# Test 6: Update GFP
echo "📝 Test 6: Update GFP..."
curl -s -X PUT -H "Content-Type: application/json" \
  -d '{"status":"completed","comments":"Updated GFP"}' \
  http://127.0.0.1:3001/api/implementation-plans/$GFP_ID | jq '.status, .comments'
echo ""

# Test 7: Delete care plan (existing one)
echo "📝 Test 7: Delete existing care plan..."
echo "Deleting: $CARE_PLAN_ID_TO_DELETE"
curl -i -X DELETE http://127.0.0.1:3001/api/care-plans/$CARE_PLAN_ID_TO_DELETE
echo ""

# Test 8: Delete GFP (existing one)
echo "📝 Test 8: Delete existing GFP..."
echo "Deleting: $GFP_ID_TO_DELETE"
curl -i -X DELETE http://127.0.0.1:3001/api/implementation-plans/$GFP_ID_TO_DELETE
echo ""

# Test 9: Verify counts and JSON diff
echo "📝 Test 9: Verify final counts and JSON diff..."
CARE_PLANS_FINAL=$(curl -s http://127.0.0.1:3001/api/care-plans/all | jq 'length')
GFP_FINAL=$(curl -s http://127.0.0.1:3001/api/implementation-plans/all | jq 'length')

echo "Final care plans: $CARE_PLANS_FINAL (was $CARE_PLANS_INITIAL)"
echo "Final GFP: $GFP_FINAL (was $GFP_INITIAL)"

# Verify the specific IDs were removed
echo ""
echo "📝 Test 10: Verify specific IDs were removed..."
CARE_PLANS_IDS=$(curl -s http://127.0.0.1:3001/api/care-plans/all | jq -r 'map(.id) | join(", ")')
GFP_IDS=$(curl -s http://127.0.0.1:3001/api/implementation-plans/all | jq -r 'map(.id) | join(", ")')

if [[ $CARE_PLANS_IDS != *"$CARE_PLAN_ID_TO_DELETE"* ]]; then
    echo "✅ Care plan $CARE_PLAN_ID_TO_DELETE successfully removed"
else
    echo "❌ Care plan $CARE_PLAN_ID_TO_DELETE still exists"
fi

if [[ $GFP_IDS != *"$GFP_ID_TO_DELETE"* ]]; then
    echo "✅ GFP $GFP_ID_TO_DELETE successfully removed"
else
    echo "❌ GFP $GFP_ID_TO_DELETE still exists"
fi

echo ""
echo "✅ CRUD verification complete!"
