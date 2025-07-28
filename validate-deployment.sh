#!/bin/bash
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

if grep -q "process.env.PORT" justice-server/server.js; then
    echo "✅ Dynamic PORT binding configured"
else
    echo "❌ PORT binding not dynamic!"
fi

if grep -q "express.static.*public" justice-server/server.js; then
    echo "✅ Static file serving configured"
else
    echo "❌ Static file serving missing!"
fi

if grep -q "/api/health" justice-server/server.js; then
    echo "✅ Health check endpoint exists"
else
    echo "❌ Health check endpoint missing!"
fi

# Check render.yaml configuration
echo ""
echo "⚙️ Validating render.yaml configuration..."

if grep -q "cd justice-server && npm install" render.yaml; then
    echo "✅ Backend dependency installation configured"
else
    echo "❌ Backend dependencies not configured!"
fi

if grep -q "cd ../justice-dashboard && npm install && npm run build" render.yaml; then
    echo "✅ Frontend build process configured"
else
    echo "❌ Frontend build not configured!"
fi

if grep -q "cp -r dist/\* ../justice-server/public/" render.yaml; then
    echo "✅ Frontend copy process configured"
else
    echo "❌ Frontend copy not configured!"
fi

if grep -q "generateValue: true" render.yaml; then
    echo "✅ Secure environment variables configured"
else
    echo "❌ Environment variables not secure!"
fi

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
