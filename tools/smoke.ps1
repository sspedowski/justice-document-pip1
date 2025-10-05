param(
  [string]$BaseUrl = $env:BASE_URL,
  [string]$BypassToken = $env:VERCEL_BYPASS_TOKEN
)

$ErrorActionPreference = 'Stop'

# Use a shared session so cookies persist (e.g., Vercel protection bypass)
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

if ([string]::IsNullOrWhiteSpace($BaseUrl)) { throw "BASE_URL is empty." }

# If a Vercel deployment protection bypass token is provided, set the bypass cookie first
if (-not [string]::IsNullOrWhiteSpace($BypassToken)) {
  $bypassUrl = "$BaseUrl?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$BypassToken"
  Write-Host "SET BYPASS COOKIE $bypassUrl" -ForegroundColor DarkCyan
  try {
    Invoke-WebRequest -Uri $bypassUrl -UseBasicParsing -WebSession $session | Out-Null
  } catch {
    Write-Warning "Bypass cookie request returned an error; continuing to attempt requests with session. $_"
  }
}

Write-Host "GET $BaseUrl" -ForegroundColor Cyan
$home = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing -WebSession $session
if ($home.StatusCode -ne 200) { throw "Home != 200 ($($home.StatusCode))" }
Write-Host "Home 200"

Write-Host "GET $BaseUrl/api/health" -ForegroundColor Cyan
$health = Invoke-WebRequest -Uri "$BaseUrl/api/health" -UseBasicParsing -WebSession $session
if ($health.StatusCode -ne 200 -or -not $health.Content.Contains("ok")) {
  throw "/api/health not ok"
}
Write-Host "/api/health → ok"

Write-Host "HEAD $BaseUrl/api/summarize/stream" -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri "$BaseUrl/api/summarize/stream" -Method Head -MaximumRedirection 0 -ErrorAction Stop -WebSession $session
} catch { $resp = $_.Exception.Response }
if (-not $resp) { throw "No response from /api/summarize/stream" }
$ct = $resp.Headers.'Content-Type'
if (-not $ct -or -not $ct.ToString().StartsWith('text/event-stream')) {
  Write-Host "Content-Type: $ct"
  throw "/api/summarize/stream not serving text/event-stream"
}
Write-Host "/api/summarize/stream returns text/event-stream"

Write-Host "POST rate-limit test: $BaseUrl/api/login" -ForegroundColor Cyan
$ok=0
for ($i=1; $i -le 6; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "$BaseUrl/api/login" -Method POST -Body '{}' -ContentType 'application/json' -ErrorAction Stop -WebSession $session
    if ($r.StatusCode -eq 200) { $ok++ }
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($i -eq 6 -and $code -eq 429) {
      Write-Host "/api/login → 6th attempt is 429"
      break
    } elseif ($code -ne 200) {
      throw "/api/login unexpected status on try $($i): $($code)"
    }
  }
}
