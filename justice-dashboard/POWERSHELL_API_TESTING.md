# Justice Dashboard: PowerShell API Testing Guide

## Overview
This guide provides correct PowerShell syntax for testing the Justice Dashboard APIs. PowerShell requires different syntax than standard curl commands.

## Why PowerShell is Different
- PowerShell's `Invoke-WebRequest`/`Invoke-RestMethod` requires headers as hash tables
- The `-H` flag from curl doesn't work in PowerShell
- Windows aliases `curl` to `Invoke-WebRequest`, not actual curl.exe

## ✅ Correct PowerShell Examples

### 1. Login Test
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = '{"username":"admin","password":"justice2025"}'
Invoke-RestMethod -Uri http://localhost:3000/api/login -Method Post -Headers $headers -Body $body
```

### 2. Health Check
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/health -Method Get
```

### 3. Wolfram Alpha Test
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = '{"query":"Calculate duration between January 15, 2023 and March 20, 2023"}'
Invoke-RestMethod -Uri http://localhost:3000/api/wolfram-test -Method Post -Headers $headers -Body $body
```

### 4. Batch Analysis Test
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @'
{
  "queries": [
    "Calculate duration between January 15, 2023 and March 20, 2023",
    "Statistical analysis of 5 violations over 6 months",
    "Timeline analysis of court dates"
  ]
}
'@
Invoke-RestMethod -Uri http://localhost:3000/api/batch-analyze -Method Post -Headers $headers -Body $body
```

### 5. OpenAI Messages API - Create Thread
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = '{"childName":"TestChild","caseType":"Family Court"}'
Invoke-RestMethod -Uri http://localhost:3000/api/case/create-thread -Method Post -Headers $headers -Body $body
```

### 6. File Upload Test (Multipart)
```powershell
# For file uploads, use multipart form data
$filePath = "C:\path\to\your\document.pdf"
$uri = "http://localhost:3000/upload"

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"document.pdf`"",
    "Content-Type: application/pdf$LF",
    [System.IO.File]::ReadAllText($filePath),
    "--$boundary--$LF"
) -join $LF

Invoke-RestMethod -Uri $uri -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
```

## ❌ Common PowerShell Mistakes

### Don't Use Curl Syntax:
```powershell
# ❌ This will fail in PowerShell
curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"justice2025"}'
```

### Don't Use String Headers:
```powershell
# ❌ This will fail
Invoke-RestMethod -Uri http://localhost:3000/api/login -Headers "Content-Type: application/json"
```

## 🛠️ Troubleshooting

### Server Connection Issues
If you get "Unable to connect to the remote server":
```powershell
# Check if backend server is running
Invoke-RestMethod -Uri http://localhost:3000/api/health -Method Get
```

### Start Backend Server
```powershell
cd backend
npm start
```

### Start Frontend Server
```powershell
cd frontend  
npm run dev
```

## 🔧 Alternative Tools

### Use Real curl.exe (if available)
If you have Git Bash, WSL, or curl.exe in PATH:
```bash
curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"justice2025"}'
```

### Use Postman
1. Set method to POST
2. Set URL to http://localhost:3000/api/login
3. Set Headers: Content-Type = application/json
4. Set Body (raw JSON): `{"username":"admin","password":"justice2025"}`

### Use HTTPie (if installed)
```bash
http POST localhost:3000/api/login username=admin password=justice2025
```

## 📋 Quick Test Checklist

1. ✅ Backend server running (port 3000)
2. ✅ Frontend server running (port 5173) 
3. ✅ Use PowerShell hash table syntax for headers
4. ✅ Use correct JSON formatting in body
5. ✅ Check server responses for debugging

## 🎯 Expected Responses

### Successful Login:
```json
{
  "ok": true
}
```

### Failed Login:
```json
{
  "error": "Invalid credentials"
}
```

### Health Check:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-02T...",
  "apis": {
    "openai": true,
    "wolfram": true
  }
}
```

---

**Need help with other APIs or tools? Check the main API documentation in `API_INTEGRATION_GUIDE.md`!**
