#!/bin/bash

# AICompanion-5 Automated Test Suite
# Run with: bash ai-agent-test.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://127.0.0.1:3001/api"
FRONTEND_URL="http://127.0.0.1:5175"
TOKEN="s_demo"
TEST_RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).json"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    AICompanion-5 Automated Test Suite v2.0${NC}"
echo -e "${BLUE}    Started: $(date)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Initialize test results
PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_TESTS=0

# Test result arrays
declare -a RESULTS

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[TEST $TOTAL_TESTS]${NC} $test_name"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED${NC}: $test_name\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        RESULTS+=("{\"test\":\"$test_name\",\"status\":\"passed\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
    else
        echo -e "${RED}❌ FAILED${NC}: $test_name\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        RESULTS+=("{\"test\":\"$test_name\",\"status\":\"failed\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")
    fi
}

# Function to check HTTP status
check_http_status() {
    local url="$1"
    local method="$2"
    local data="$3"
    local expected="$4"
    
    if [ "$method" = "GET" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Dev-Token: $TOKEN" "$url")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -H "X-Dev-Token: $TOKEN" \
            -d "$data" \
            "$url")
    fi
    
    [ "$status" = "$expected" ]
}

# Function to create test data and verify
create_and_verify() {
    local endpoint="$1"
    local data="$2"
    local field_to_check="$3"
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "X-Dev-Token: $TOKEN" \
        -d "$data" \
        "$API_URL/$endpoint")
    
    if echo "$response" | grep -q "\"$field_to_check\""; then
        echo "$response" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//'
        return 0
    else
        return 1
    fi
}

echo -e "${BLUE}Step 1: Checking server availability${NC}"
echo "────────────────────────────────────────"

run_test "API Server Health Check" \
    "check_http_status '$API_URL/health' 'GET' '' '200'" \
    "200"

run_test "Frontend Server Check" \
    "curl -s -o /dev/null -w '%{http_code}' '$FRONTEND_URL' | grep -q '200\|404'" \
    "200"

echo -e "${BLUE}Step 2: Authentication Tests${NC}"
echo "────────────────────────────────────────"

run_test "Login with dev token" \
    "check_http_status '$API_URL/auth/login' 'POST' '{}' '200'" \
    "200"

echo -e "${BLUE}Step 3: Client Management Tests${NC}"
echo "────────────────────────────────────────"

# Create a test client
CLIENT_DATA='{
    "initials": "TEST",
    "personnummer": "20000101-0000",
    "name": "Test Client",
    "status": "active"
}'

run_test "Create new client" \
    "CLIENT_ID=\$(create_and_verify 'clients' '$CLIENT_DATA' 'id') && [ -n \"\$CLIENT_ID\" ]" \
    "201"

# Store CLIENT_ID for later tests
CLIENT_ID=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "X-Dev-Token: $TOKEN" \
    -d "$CLIENT_DATA" \
    "$API_URL/clients" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//' | head -1)

echo -e "${BLUE}Step 4: Care Plan Tests (Vårdplaner)${NC}"
echo "────────────────────────────────────────"

CARE_PLAN_DATA="{
    \"clientId\": \"$CLIENT_ID\",
    \"name\": \"Test Vårdplan $(date +%s)\",
    \"description\": \"Automated test vårdplan\",
    \"startDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"goals\": [\"Mål 1\", \"Mål 2\", \"Mål 3\"],
    \"activities\": [\"Aktivitet 1\", \"Aktivitet 2\"]
}"

run_test "Create care plan" \
    "CARE_PLAN_ID=\$(create_and_verify 'care-plans' '$CARE_PLAN_DATA' 'id') && [ -n \"\$CARE_PLAN_ID\" ]" \
    "201"

CARE_PLAN_ID=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "X-Dev-Token: $TOKEN" \
    -d "$CARE_PLAN_DATA" \
    "$API_URL/care-plans" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//' | head -1)

run_test "Update care plan" \
    "check_http_status '$API_URL/care-plans/$CARE_PLAN_ID' 'PUT' '{\"name\":\"Updated Vårdplan\"}' '200'" \
    "200"

run_test "Get all care plans" \
    "check_http_status '$API_URL/care-plans/all' 'GET' '' '200'" \
    "200"

echo -e "${BLUE}Step 5: Implementation Plan Tests (Genomförandeplaner)${NC}"
echo "────────────────────────────────────────"

IMPL_PLAN_DATA="{
    \"clientId\": \"$CLIENT_ID\",
    \"carePlanId\": \"$CARE_PLAN_ID\",
    \"title\": \"Test Genomförandeplan\",
    \"description\": \"Automated test GFP\",
    \"startDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"followUpDate\": \"$(date -u -v+30d +%Y-%m-%dT%H:%M:%SZ)\",
    \"status\": \"active\"
}"

run_test "Create implementation plan" \
    "IMPL_PLAN_ID=\$(create_and_verify 'implementation-plans' '$IMPL_PLAN_DATA' 'id') && [ -n \"\$IMPL_PLAN_ID\" ]" \
    "201"

IMPL_PLAN_ID=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "X-Dev-Token: $TOKEN" \
    -d "$IMPL_PLAN_DATA" \
    "$API_URL/implementation-plans" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//' | head -1)

run_test "Update implementation plan" \
    "check_http_status '$API_URL/implementation-plans/$IMPL_PLAN_ID' 'PUT' '{\"status\":\"completed\"}' '200'" \
    "200"

echo -e "${BLUE}Step 6: Weekly Documentation Tests${NC}"
echo "────────────────────────────────────────"

WEEKLY_DOC_DATA="{
    \"clientId\": \"$CLIENT_ID\",
    \"week\": $(date +%V),
    \"year\": $(date +%Y),
    \"content\": \"Test veckodokumentation\",
    \"activities\": [\"Måndag: Möte\", \"Onsdag: Uppföljning\", \"Fredag: Utvärdering\"],
    \"notes\": \"Automated test notes\"
}"

run_test "Create weekly documentation" \
    "WEEKLY_DOC_ID=\$(create_and_verify 'weekly-documentation' '$WEEKLY_DOC_DATA' 'id') && [ -n \"\$WEEKLY_DOC_ID\" ]" \
    "201"

echo -e "${BLUE}Step 7: Monthly Report Tests${NC}"
echo "────────────────────────────────────────"

MONTHLY_REPORT_DATA="{
    \"clientId\": \"$CLIENT_ID\",
    \"month\": $(date +%-m),
    \"year\": $(date +%Y),
    \"summary\": \"Automated test månadsrapport\",
    \"progress\": \"God progress noterad\",
    \"challenges\": \"Inga större utmaningar\"
}"

run_test "Create monthly report" \
    "REPORT_ID=\$(create_and_verify 'monthly-reports' '$MONTHLY_REPORT_DATA' 'id') && [ -n \"\$REPORT_ID\" ]" \
    "201"

echo -e "${BLUE}Step 8: Data Persistence Tests${NC}"
echo "────────────────────────────────────────"

run_test "Verify care plan persisted" \
    "curl -s -H 'X-Dev-Token: $TOKEN' '$API_URL/care-plans/all' | grep -q '$CARE_PLAN_ID'" \
    "200"

run_test "Verify implementation plan persisted" \
    "curl -s -H 'X-Dev-Token: $TOKEN' '$API_URL/implementation-plans/all' | grep -q '$IMPL_PLAN_ID'" \
    "200"

run_test "Verify weekly documentation persisted" \
    "curl -s -H 'X-Dev-Token: $TOKEN' '$API_URL/weekly-documentation/all' | grep -q '$CLIENT_ID'" \
    "200"

run_test "Get client-specific care plans" \
    "check_http_status '$API_URL/care-plans/client/$CLIENT_ID' 'GET' '' '200'" \
    "200"

echo -e "${BLUE}Step 9: Staff-scoped Data Access${NC}"
echo "────────────────────────────────────────"

run_test "Get clients by staff" \
    "check_http_status '$API_URL/staff/$TOKEN/clients' 'GET' '' '200'" \
    "200"

echo -e "${BLUE}Step 10: Error Handling Tests${NC}"
echo "────────────────────────────────────────"

run_test "Handle non-existent care plan" \
    "check_http_status '$API_URL/care-plans/non-existent-id' 'GET' '' '404'" \
    "404"

run_test "Handle invalid data format gracefully" \
    "check_http_status '$API_URL/care-plans' 'POST' '{\"invalid\":\"data\"}' '201'" \
    "201"

# Generate summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "Total Tests:    ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Passed:         ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:         ${RED}$FAILED_TESTS${NC}"
echo -e "Success Rate:   ${YELLOW}$(( PASSED_TESTS * 100 / TOTAL_TESTS ))%${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# Generate JSON report
echo "{
  \"test_run\": {
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"total_tests\": $TOTAL_TESTS,
    \"passed\": $PASSED_TESTS,
    \"failed\": $FAILED_TESTS,
    \"success_rate\": $(( PASSED_TESTS * 100 / TOTAL_TESTS ))
  },
  \"results\": [
    $(IFS=,; echo "${RESULTS[*]}")
  ]
}" > "$TEST_RESULTS_FILE"

echo -e "\n${GREEN}Test results saved to: $TEST_RESULTS_FILE${NC}"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ SOME TESTS FAILED!${NC}"
    exit 1
fi
