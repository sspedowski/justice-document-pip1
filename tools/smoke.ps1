Param(
  [string]$BaseUrl = $env:BASE_URL
)

if (-not $BaseUrl -or $BaseUrl.Trim() -eq '') {
  $BaseUrl = 'http://localhost:3000'
}

Write-Host "Smoke: Using base URL -> $BaseUrl" -ForegroundColor Cyan

$ErrorActionPreference = 'Stop'
$failed = @()

function Step($name, [scriptblock]$block) {
  try {
    & $block
    Write-Host "PASS - $name" -ForegroundColor Green
  }
  catch {
    Write-Host "FAIL - $name: $($_.Exception.Message)" -ForegroundColor Red
    $script:failed += $name
  }
}

Step "Home reachable" {
  $res = curl.exe -s -o NUL -w "%{http_code}" -I $BaseUrl
  if ($res -notmatch '^(200|301|302|308)$') { throw "Unexpected status: $res" }
}

Step "/api/health returns ok" {
  $json = curl.exe -s "$BaseUrl/api/health" | Out-String
  if ($json -notmatch 'ok' -and $json -notmatch 'status') { throw "No ok/status in: $json" }
}

Step "Rate limit on /api/login (6th=429)" {
  $codes = @()
  for ($i=1; $i -le 6; $i++) {
    $code = curl.exe -s -o NUL -w "%{http_code}" -X POST "$BaseUrl/api/login" -H "Content-Type: application/json" --data '{"username":"x","password":"y"}'
    $codes += $code
    Start-Sleep -Milliseconds 50
  }
  if ($codes[-1] -ne '429') { throw "Expected 429 on 6th, got: $($codes -join ',')" }
}

Step "SSE stream responds (headers)" {
  $headers = curl.exe -s -D - -N -X POST "$BaseUrl/api/summarize/stream" -H "Accept: text/event-stream" -H "Content-Type: application/json" --data '{"text":"smoke"}' --max-time 8 | Select-String -Pattern "content-type" -SimpleMatch | Out-String
  if ($headers -notmatch "text/event-stream") { throw "Missing text/event-stream in headers: $headers" }
}

if ($failed.Count -gt 0) {
  Write-Host "\nSmoke FAILED ($($failed.Count)) -> $($failed -join ', ')" -ForegroundColor Red
  exit 1
} else {
  Write-Host "\nSmoke PASSED" -ForegroundColor Green
}
