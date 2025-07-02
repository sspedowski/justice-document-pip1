# Justice Dashboard - Server Status Check
# Run this script to verify both frontend and backend servers are running properly

Write-Host "=== Justice Dashboard Server Status Check ===" -ForegroundColor Green
Write-Host ""

# Check Backend Server (Port 3000)
Write-Host "🔧 Checking Backend Server (port 3000)..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 5
    if ($backendResponse.status -eq "healthy") {
        Write-Host "✅ Backend Server: RUNNING" -ForegroundColor Green
        Write-Host "   Status: $($backendResponse.status)" -ForegroundColor Gray
        Write-Host "   OpenAI: $($backendResponse.openaiConfigured)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Backend Server: UNHEALTHY" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend Server: NOT RUNNING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "   💡 To start: cd backend; npm start" -ForegroundColor Cyan
}

Write-Host ""

# Check Frontend Server (Port 5173)
Write-Host "🌐 Checking Frontend Server (port 5173)..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173/" -Method Get -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend Server: RUNNING" -ForegroundColor Green
        Write-Host "   Status Code: $($frontendResponse.StatusCode)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Frontend Server: UNEXPECTED RESPONSE" -ForegroundColor Yellow
        Write-Host "   Status Code: $($frontendResponse.StatusCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Frontend Server: NOT RUNNING" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "   💡 To start: cd frontend; npm run dev" -ForegroundColor Cyan
}

Write-Host ""

# Check for Node.js processes
Write-Host "📊 Node.js Processes:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "   PID $($_.Id): $($_.ProcessName) (CPU: $($_.CPU.ToString('F2'))s)" -ForegroundColor Gray
    }
} else {
    Write-Host "   No Node.js processes found" -ForegroundColor Gray
}

Write-Host ""

# Summary and Next Steps
Write-Host "=== Summary ===" -ForegroundColor Green
Write-Host "Frontend URL: http://localhost:5173/" -ForegroundColor Cyan
Write-Host "Backend API:  http://localhost:3000/api/" -ForegroundColor Cyan
Write-Host "API Test:     http://localhost:5173/api-test.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 If both servers are running, your Justice Dashboard is ready!" -ForegroundColor Green
Write-Host ""

# Quick start commands if servers are down
Write-Host "📋 Quick Start Commands:" -ForegroundColor Yellow
Write-Host "# Start Backend:"
Write-Host "cd backend && npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Start Frontend:"
Write-Host "cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Check this status again:"
Write-Host ".\check-servers.ps1" -ForegroundColor Cyan
