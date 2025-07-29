#!/bin/bash

# DreamShepherd API Integration Test Script
# Tests all endpoints with curl commands

set -e  # Exit on error

API_BASE="http://localhost:3001"
TEST_EMAIL="test-$(date +%s)@dreamshepherd.test"
TEST_PASSWORD="TestPassword123!"
TEST_DREAM_TITLE="My Integration Test Dream"
TEST_DREAM_VISION='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is a test dream vision for integration testing."}]}]}'

echo "🚀 Starting DreamShepherd API Integration Tests"
echo "📧 Test email: $TEST_EMAIL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "  ${RED}❌ FAIL${NC}: $2"
        echo "  Response: $3"
    fi
}

echo "=== 1. HEALTH CHECK ==="
response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_BASE/health")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    print_result 0 "Health check"
    echo "  $(cat /tmp/health_response.json | jq -r '.status')"
else
    print_result 1 "Health check" "HTTP $http_code"
fi
echo ""

echo "=== 2. API ROOT ENDPOINT ==="
response=$(curl -s -w "%{http_code}" -o /tmp/api_response.json "$API_BASE/api")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    print_result 0 "API root endpoint"
else
    print_result 1 "API root endpoint" "HTTP $http_code"
fi
echo ""

echo "=== 3. INTRO DREAMER FLOW ==="

# Create IntroDreamer session
echo "Creating IntroDreamer session..."
intro_response=$(curl -s -w "%{http_code}" -o /tmp/intro_create.json \
    -X POST "$API_BASE/auth/intro" \
    -H "Content-Type: application/json" \
    -d @- << EOF
{
    "email": "$TEST_EMAIL",
    "dreamTitle": "$TEST_DREAM_TITLE",
    "dreamVision": $TEST_DREAM_VISION
}
EOF
)

intro_http_code="${intro_response: -3}"
if [ "$intro_http_code" = "201" ]; then
    print_result 0 "Create IntroDreamer session"
    TEMP_TOKEN=$(cat /tmp/intro_create.json | jq -r '.data.returnUrl' | sed 's/.*token=//')
    echo "  Temp token: ${TEMP_TOKEN:0:20}..."
else
    print_result 1 "Create IntroDreamer session" "HTTP $intro_http_code - $(cat /tmp/intro_create.json)"
    exit 1
fi

# Get IntroDreamer session by token
echo "Getting IntroDreamer session by token..."
get_intro_response=$(curl -s -w "%{http_code}" -o /tmp/intro_get.json \
    "$API_BASE/auth/intro/$TEMP_TOKEN")

get_intro_http_code="${get_intro_response: -3}"
if [ "$get_intro_http_code" = "200" ]; then
    print_result 0 "Get IntroDreamer session by token"
else
    print_result 1 "Get IntroDreamer session by token" "HTTP $get_intro_http_code"
fi

# Update IntroDreamer session
echo "Updating IntroDreamer session..."
update_intro_response=$(curl -s -w "%{http_code}" -o /tmp/intro_update.json \
    -X PUT "$API_BASE/auth/intro/$TEMP_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"dreamVision\": \"Updated vision content for testing\"
    }")

update_intro_http_code="${update_intro_response: -3}"
if [ "$update_intro_http_code" = "200" ]; then
    print_result 0 "Update IntroDreamer session"
else
    print_result 1 "Update IntroDreamer session" "HTTP $update_intro_http_code"
fi
echo ""

echo "=== 4. REGISTRATION (UPGRADE FROM INTRO) ==="

# Register full account from IntroDreamer
echo "Upgrading IntroDreamer to full Dreamer account..."
register_response=$(curl -s -w "%{http_code}" -o /tmp/register.json \
    -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -c /tmp/cookies.txt \
    -d "{
        \"tempToken\": \"$TEMP_TOKEN\",
        \"password\": \"$TEST_PASSWORD\"
    }")

register_http_code="${register_response: -3}"
if [ "$register_http_code" = "201" ]; then
    print_result 0 "Upgrade to full Dreamer account"
    ACCESS_TOKEN=$(cat /tmp/register.json | jq -r '.data.accessToken')
    DREAMER_ID=$(cat /tmp/register.json | jq -r '.data.dreamer.id')
    DREAM_SLUG=$(cat /tmp/register.json | jq -r '.data.dream.slug')
    echo "  Dreamer ID: $DREAMER_ID"
    echo "  Dream slug: $DREAM_SLUG"
    echo "  Access token: ${ACCESS_TOKEN:0:20}..."
else
    print_result 1 "Upgrade to full Dreamer account" "HTTP $register_http_code - $(cat /tmp/register.json)"
    exit 1
fi
echo ""

echo "=== 5. AUTHENTICATION FLOW ==="

# Test /auth/me endpoint
echo "Testing /auth/me endpoint..."
me_response=$(curl -s -w "%{http_code}" -o /tmp/me.json \
    "$API_BASE/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

me_http_code="${me_response: -3}"
if [ "$me_http_code" = "200" ]; then
    print_result 0 "Get current dreamer info"
else
    print_result 1 "Get current dreamer info" "HTTP $me_http_code"
fi

# Test token refresh
echo "Testing token refresh..."
refresh_response=$(curl -s -w "%{http_code}" -o /tmp/refresh.json \
    -X POST "$API_BASE/auth/refresh" \
    -b /tmp/cookies.txt)

refresh_http_code="${refresh_response: -3}"
if [ "$refresh_http_code" = "200" ]; then
    print_result 0 "Token refresh"
    NEW_ACCESS_TOKEN=$(cat /tmp/refresh.json | jq -r '.data.accessToken')
    ACCESS_TOKEN=$NEW_ACCESS_TOKEN  # Use new token for subsequent tests
else
    print_result 1 "Token refresh" "HTTP $refresh_http_code"
fi
echo ""

echo "=== 6. DREAM API ENDPOINTS ==="

# Get all dreams
echo "Getting all dreams..."
dreams_response=$(curl -s -w "%{http_code}" -o /tmp/dreams_list.json \
    "$API_BASE/api/dreams" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

dreams_http_code="${dreams_response: -3}"
if [ "$dreams_http_code" = "200" ]; then
    print_result 0 "Get all dreams"
    dream_count=$(cat /tmp/dreams_list.json | jq -r '.count')
    echo "  Dream count: $dream_count"
else
    print_result 1 "Get all dreams" "HTTP $dreams_http_code"
fi

# Get specific dream by slug
echo "Getting dream by slug..."
dream_response=$(curl -s -w "%{http_code}" -o /tmp/dream_get.json \
    "$API_BASE/api/dreams/$DREAM_SLUG" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

dream_http_code="${dream_response: -3}"
if [ "$dream_http_code" = "200" ]; then
    print_result 0 "Get dream by slug"
else
    print_result 1 "Get dream by slug" "HTTP $dream_http_code"
fi

# Update dream
echo "Updating dream..."
update_dream_response=$(curl -s -w "%{http_code}" -o /tmp/dream_update.json \
    -X PUT "$API_BASE/api/dreams/$DREAM_SLUG" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"vision\": \"Updated dream vision through API testing\"
    }")

update_dream_http_code="${update_dream_response: -3}"
if [ "$update_dream_http_code" = "200" ]; then
    print_result 0 "Update dream"
else
    print_result 1 "Update dream" "HTTP $update_dream_http_code"
fi

# Create new dream
echo "Creating additional dream..."
NEW_DREAM_ID=$(uuidgen)
create_dream_response=$(curl -s -w "%{http_code}" -o /tmp/dream_create.json \
    -X POST "$API_BASE/api/dreams" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"id\": \"$NEW_DREAM_ID\",
        \"title\": \"Second Test Dream\",
        \"vision\": \"This is a second dream created during API testing\"
    }")

create_dream_http_code="${create_dream_response: -3}"
if [ "$create_dream_http_code" = "201" ]; then
    print_result 0 "Create new dream"
    NEW_DREAM_SLUG=$(cat /tmp/dream_create.json | jq -r '.data.slug')
    echo "  New dream slug: $NEW_DREAM_SLUG"
else
    print_result 1 "Create new dream" "HTTP $create_dream_http_code - $(cat /tmp/dream_create.json)"
fi

# Get dream stats
echo "Getting dream statistics..."
stats_response=$(curl -s -w "%{http_code}" -o /tmp/dream_stats.json \
    "$API_BASE/api/dreams/$DREAM_SLUG/stats" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

stats_http_code="${stats_response: -3}"
if [ "$stats_http_code" = "200" ]; then
    print_result 0 "Get dream statistics"
else
    print_result 1 "Get dream statistics" "HTTP $stats_http_code"
fi

# Test duplicate title handling
echo "Testing duplicate title handling..."
duplicate_response=$(curl -s -w "%{http_code}" -o /tmp/dream_duplicate.json \
    -X POST "$API_BASE/api/dreams" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"id\": \"$(uuidgen)\",
        \"title\": \"$TEST_DREAM_TITLE\",
        \"vision\": \"This should conflict with existing dream\"
    }")

duplicate_http_code="${duplicate_response: -3}"
if [ "$duplicate_http_code" = "409" ]; then
    print_result 0 "Duplicate title handling (should return 409)"
    existing_dream=$(cat /tmp/dream_duplicate.json | jq -r '.existingDream.slug')
    echo "  Returned existing dream slug: $existing_dream"
else
    print_result 1 "Duplicate title handling" "Expected 409, got HTTP $duplicate_http_code"
fi

# Delete the second dream
if [ ! -z "$NEW_DREAM_SLUG" ]; then
    echo "Deleting second dream..."
    delete_response=$(curl -s -w "%{http_code}" -o /tmp/dream_delete.json \
        -X DELETE "$API_BASE/api/dreams/$NEW_DREAM_SLUG" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    delete_http_code="${delete_response: -3}"
    if [ "$delete_http_code" = "200" ]; then
        print_result 0 "Delete dream"
    else
        print_result 1 "Delete dream" "HTTP $delete_http_code"
    fi
fi
echo ""

echo "=== 7. DIRECT REGISTRATION TEST ==="

# Test direct registration (without IntroDreamer)
DIRECT_EMAIL="direct-test-$(date +%s)@dreamshepherd.test"
echo "Testing direct registration..."
direct_register_response=$(curl -s -w "%{http_code}" -o /tmp/direct_register.json \
    -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -c /tmp/direct_cookies.txt \
    -d "{
        \"email\": \"$DIRECT_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

direct_register_http_code="${direct_register_response: -3}"
if [ "$direct_register_http_code" = "201" ]; then
    print_result 0 "Direct registration (no IntroDreamer)"
    DIRECT_DREAMER_ID=$(cat /tmp/direct_register.json | jq -r '.data.dreamer.id')
    DIRECT_ACCESS_TOKEN=$(cat /tmp/direct_register.json | jq -r '.data.accessToken')
    echo "  Direct dreamer ID: $DIRECT_DREAMER_ID"
else
    print_result 1 "Direct registration" "HTTP $direct_register_http_code - $(cat /tmp/direct_register.json)"
fi
echo ""

echo "=== 8. LOGIN TEST ==="

# Test login with the direct registration account
echo "Testing login..."
login_response=$(curl -s -w "%{http_code}" -o /tmp/login.json \
    -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -c /tmp/login_cookies.txt \
    -d "{
        \"email\": \"$DIRECT_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

login_http_code="${login_response: -3}"
if [ "$login_http_code" = "200" ]; then
    print_result 0 "Login with credentials"
else
    print_result 1 "Login with credentials" "HTTP $login_http_code"
fi

# Test login with wrong password
echo "Testing login with wrong password..."
wrong_login_response=$(curl -s -w "%{http_code}" -o /tmp/wrong_login.json \
    -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$DIRECT_EMAIL\",
        \"password\": \"WrongPassword123!\"
    }")

wrong_login_http_code="${wrong_login_response: -3}"
if [ "$wrong_login_http_code" = "401" ]; then
    print_result 0 "Wrong password handling (should return 401)"
else
    print_result 1 "Wrong password handling" "Expected 401, got HTTP $wrong_login_http_code"
fi
echo ""

echo "=== 9. LOGOUT TEST ==="

# Test logout
echo "Testing logout..."
logout_response=$(curl -s -w "%{http_code}" -o /tmp/logout.json \
    -X POST "$API_BASE/auth/logout" \
    -b /tmp/cookies.txt)

logout_http_code="${logout_response: -3}"
if [ "$logout_http_code" = "200" ]; then
    print_result 0 "Logout"
else
    print_result 1 "Logout" "HTTP $logout_http_code"
fi
echo ""

echo "=== 10. UNAUTHORIZED ACCESS TEST ==="

# Test accessing protected endpoint without token
echo "Testing unauthorized access..."
unauth_response=$(curl -s -w "%{http_code}" -o /tmp/unauth.json \
    "$API_BASE/auth/me")

unauth_http_code="${unauth_response: -3}"
if [ "$unauth_http_code" = "401" ]; then
    print_result 0 "Unauthorized access handling (should return 401)"
else
    print_result 1 "Unauthorized access handling" "Expected 401, got HTTP $unauth_http_code"
fi
echo ""

echo "🧹 CLEANUP"
echo "Test users created:"
echo "  1. Upgraded IntroDreamer: $TEST_EMAIL (ID: $DREAMER_ID)"
echo "  2. Direct registration: $DIRECT_EMAIL (ID: $DIRECT_DREAMER_ID)"
echo ""

echo "💾 MongoDB Cleanup Queries:"
echo ""
echo -e "${YELLOW}# Connect to MongoDB and run these queries to cleanup test data:${NC}"
echo ""
echo "use dreamshepherd;"
echo ""
echo "# Delete test dreamers"
echo "db.dreamers.deleteOne({\"email\": \"$TEST_EMAIL\"});"
echo "db.dreamers.deleteOne({\"email\": \"$DIRECT_EMAIL\"});"
echo ""
echo "# Delete dreams created by test dreamers"
echo "db.dreams.deleteMany({\"dreamerId\": ObjectId(\"$DREAMER_ID\")});"
if [ ! -z "$DIRECT_DREAMER_ID" ]; then
echo "db.dreams.deleteMany({\"dreamerId\": ObjectId(\"$DIRECT_DREAMER_ID\")});"
fi
echo ""
echo "# Verify cleanup"
echo "db.dreamers.find({\"email\": {\$regex: \"@dreamshepherd.test\"}}).count();"
echo "db.dreams.find().count();"
echo ""

# Cleanup temp files
rm -f /tmp/*_response.json /tmp/cookies.txt /tmp/direct_cookies.txt /tmp/login_cookies.txt 2>/dev/null || true
rm -f /tmp/health_response.json /tmp/api_response.json /tmp/intro_*.json /tmp/register.json 2>/dev/null || true
rm -f /tmp/me.json /tmp/refresh.json /tmp/dreams_*.json /tmp/dream_*.json 2>/dev/null || true
rm -f /tmp/direct_register.json /tmp/login.json /tmp/wrong_login.json /tmp/logout.json /tmp/unauth.json 2>/dev/null || true

echo -e "${GREEN}✨ Integration test complete!${NC}"
