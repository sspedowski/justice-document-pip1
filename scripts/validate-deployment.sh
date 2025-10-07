#!/bin/bash
set -euo pipefail
# 🚀 Justice Dashboard - Render Deployment Validation Script

echo "🔍 JUSTICE DASHBOARD DEPLOYMENT VALIDATION"
echo "=========================================="

# Check if all critical files exist
echo "📁 Checking critical files..."

if [ -f "render.yaml" ]; then
    echo "✅ render.yaml exists"
else
    echo "❌ render.yaml missing!"
    exit 1
fi

if [ -f "justice-server/server.js" ]; then
    echo "✅ justice-server/server.js exists"
else
    echo "❌ justice-server/server.js missing!"
    exit 1
fi

if [ -f "justice-dashboard/package.json" ]; then
    echo "✅ justice-dashboard/package.json exists"
else
    echo "❌ justice-dashboard/package.json missing!"
    exit 1
fi

# Check server.js for critical configurations
echo ""
echo "🔧 Validating server.js configurations..."

grep -q "process.env.PORT" justice-server/server.js && echo "✅ Dynamic PORT binding configured" || { echo "❌ PORT binding not dynamic!"; exit 1; }

grep -q "express.static.*public" justice-server/server.js && echo "✅ Static file serving configured" || { echo "❌ Static file serving missing!"; exit 1; }

grep -q "/api/health" justice-server/server.js && echo "✅ Health check endpoint exists" || { echo "❌ Health check endpoint missing!"; exit 1; }

# Check render.yaml configuration
echo ""
echo "⚙️ Validating render.yaml configuration..."

grep -q "cd justice-server && npm install" render.yaml && echo "✅ Backend dependency installation configured" || { echo "❌ Backend dependencies not configured!"; exit 1; }

grep -q "cd ../justice-dashboard && npm install && npm run build" render.yaml && echo "✅ Frontend build process configured" || { echo "❌ Frontend build not configured!"; exit 1; }

grep -q "cp -r dist/\* ../justice-server/public/" render.yaml && echo "✅ Frontend copy process configured" || { echo "❌ Frontend copy not configured!"; exit 1; }

grep -q "generateValue: true" render.yaml && echo "✅ Secure environment variables configured" || { echo "❌ Environment variables not secure!"; exit 1; }

echo ""
echo "🎯 DEPLOYMENT READINESS SUMMARY"
echo "================================"
echo "✅ All critical files present"
echo "✅ Server configuration validated"
echo "✅ Render configuration validated"
echo "✅ Security configurations in place"
echo ""
echo "🚀 STATUS: READY FOR RENDER DEPLOYMENT"
echo "💡 Next step: git push origin main"
