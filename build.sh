#!/bin/bash

echo "🚀 Render Build Script - Installing Justice Dashboard Dependencies"

# Install root dependencies
echo "📦 Step 1: Installing root dependencies..."
npm install || exit 1

# Install backend dependencies  
echo "📦 Step 2: Installing backend dependencies (justice-server)..."
cd justice-server || exit 1
npm install || exit 1
cd .. || exit 1

# Install frontend dependencies
echo "📦 Step 3: Installing frontend dependencies (justice-dashboard)..."
cd justice-dashboard || exit 1 
npm install || exit 1
cd .. || exit 1

echo "✅ All dependencies installed successfully!"
echo "🔍 Verifying express module..."

# Verify express is installed
if [ -f "justice-server/node_modules/express/package.json" ]; then
    echo "✅ Express module found in justice-server/node_modules/"
else
    echo "❌ Express module NOT found!"
    echo "📂 Listing justice-server/node_modules contents..."
    ls -la justice-server/node_modules/ | head -10
    exit 1
fi

echo "🎉 Build complete - ready to start server!"
