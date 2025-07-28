#!/bin/bash

# Production start script for Justice Dashboard
echo "🚀 Starting Justice Dashboard in production mode..."

# Set production environment
export NODE_ENV=production

# Validate critical environment variables
if [ -z "$JWT_SECRET" ] || [ -z "$SESSION_SECRET" ]; then
  echo "❌ CRITICAL: JWT_SECRET and SESSION_SECRET must be set in production"
  exit 1
fi

if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "❌ CRITICAL: JWT_SECRET must be at least 32 characters"
  exit 1
fi

if [ ${#SESSION_SECRET} -lt 32 ]; then
  echo "❌ CRITICAL: SESSION_SECRET must be at least 32 characters"  
  exit 1
fi

echo "✅ Environment validation passed"
echo "🔑 JWT_SECRET: Set (${#JWT_SECRET} chars)"
echo "🔑 SESSION_SECRET: Set (${#SESSION_SECRET} chars)"
echo "🔑 ADMIN_USERNAME: ${ADMIN_USERNAME:-admin}"

# Start the server
echo "🚀 Starting server on port ${PORT:-3000}..."
node server.js
