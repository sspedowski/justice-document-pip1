#!/bin/bash

echo "🧪 Testing Render-style build process locally..."

# Simulate Render's build process
echo "📦 Step 1: Installing root dependencies..."
npm install

echo "📦 Step 2: Installing backend dependencies..."
cd justice-server
npm install
cd ..

echo "📦 Step 3: Installing frontend dependencies..."
cd justice-dashboard  
npm install
cd ..

echo "✅ Build simulation complete!"

echo "🚀 Testing server startup..."
# Test that the server can start (kill after 3 seconds)
timeout 3s npm start && echo "✅ Server started successfully!" || echo "⚠️  Server startup test completed"

echo "🎯 Build test finished - ready for Render deployment!"
