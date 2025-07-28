#!/bin/bash

# Health check script for Justice Dashboard
# Returns 0 if healthy, 1 if unhealthy

echo "🔍 Justice Dashboard Health Check"

# Check if server is responding
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT:-3000}/api/health 2>/dev/null)

if [ "$HEALTH_CHECK" = "200" ]; then
  echo "✅ Server is healthy (HTTP 200)"
  
  # Test login endpoint
  LOGIN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' \
    http://localhost:${PORT:-3000}/api/login 2>/dev/null)
  
  if [ "$LOGIN_CHECK" = "401" ] || [ "$LOGIN_CHECK" = "200" ]; then
    echo "✅ Login endpoint is responding"
    exit 0
  else
    echo "❌ Login endpoint not responding (HTTP $LOGIN_CHECK)"
    exit 1
  fi
else
  echo "❌ Server is unhealthy (HTTP $HEALTH_CHECK)"
  exit 1
fi
