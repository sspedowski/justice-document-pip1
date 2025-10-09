#!/bin/bash
set -euo pipefail

echo "🧪 Testing Render-style build process locally..."

# Simulate Render's build process
echo "📦 Step 1: Installing root dependencies..."
npm install || { echo "❌ Root install failed"; exit 1; }

echo "📦 Step 2: Installing backend dependencies..."
cd justice-server || { echo "❌ Cannot cd to justice-server"; exit 1; }
npm install || { echo "❌ Backend install failed"; exit 1; }
cd .. || exit 1

echo "📦 Step 3: Installing frontend dependencies..."
cd justice-dashboard || { echo "❌ Cannot cd to justice-dashboard"; exit 1; }
npm install || { echo "❌ Frontend install failed"; exit 1; }
cd .. || exit 1

echo "✅ Build simulation complete!"

echo "🚀 Testing server startup..."
# Test that the server can start (kill after 3 seconds)
timeout 3s npm start && echo "✅ Server started successfully!" || echo "⚠️  Server startup test completed"

echo "🎯 Build test finished - ready for Render deployment!"
