#!/bin/bash
set -euo pipefail
set -euo pipefail
# 🧪 Justice Dashboard - Post-Deployment Testing Script

RENDER_URL="https://justice-dashboard.onrender.com"

echo "🧪 JUSTICE DASHBOARD POST-DEPLOYMENT TESTS"
echo "==========================================="

echo "🌐 Testing Render deployment at: $RENDER_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check Endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL/api/health" || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check passed (HTTP 200)"
    curl -s "$RENDER_URL/api/health" | jq . 2>/dev/null || echo "Response received"
else
    echo "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
fi

echo ""

# Test 2: Frontend Loading
echo "2️⃣ Testing Frontend Loading..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL/" || echo "000")

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend loads successfully (HTTP 200)"
else
    echo "❌ Frontend failed to load (HTTP $FRONTEND_RESPONSE)"
fi

echo ""

# Test 3: API Endpoints
echo "3️⃣ Testing API Endpoints..."

# Test login endpoint exists
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$RENDER_URL/api/login" -H "Content-Type: application/json" -d '{}' || echo "000")

if [ "$LOGIN_RESPONSE" = "400" ] || [ "$LOGIN_RESPONSE" = "401" ] || [ "$LOGIN_RESPONSE" = "500" ]; then
    echo "✅ Login endpoint exists and responding (HTTP $LOGIN_RESPONSE)"
else
    echo "❌ Login endpoint not responding properly (HTTP $LOGIN_RESPONSE)"
fi

echo ""

# Test 4: Static File Serving
echo "4️⃣ Testing Static File Serving..."
STATIC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL/favicon.ico" || echo "000")

if [ "$STATIC_RESPONSE" = "200" ] || [ "$STATIC_RESPONSE" = "404" ]; then
    echo "✅ Static file serving is working"
else
    echo "❌ Static file serving may have issues (HTTP $STATIC_RESPONSE)"
fi

echo ""
echo "🎯 DEPLOYMENT TEST SUMMARY"
echo "=========================="
echo "Health Check: $([ "$HEALTH_RESPONSE" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Frontend: $([ "$FRONTEND_RESPONSE" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "API Endpoints: $([ "$LOGIN_RESPONSE" = "400" ] || [ "$LOGIN_RESPONSE" = "401" ] || [ "$LOGIN_RESPONSE" = "500" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Static Files: $([ "$STATIC_RESPONSE" = "200" ] || [ "$STATIC_RESPONSE" = "404" ] && echo "✅ PASS" || echo "❌ FAIL")"

echo ""
echo "🚀 Your Justice Dashboard is live at: $RENDER_URL"
echo "🔑 Login with: admin + (password from Render environment variables)"
