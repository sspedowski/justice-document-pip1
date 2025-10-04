param(
  [Parameter(Mandatory=$true)][string]$AppUrl
)

function Head($url) {
  try { (Invoke-WebRequest -Method Head -Uri $url -TimeoutSec 15).StatusCode } catch { $_.Exception.Response.StatusCode.Value__ }
}

$home   = Head $AppUrl
$health = Head "$AppUrl/api/health"
$ping   = Head "$AppUrl/api/rtdb/ping"

Write-Host "HOME   : $home"
Write-Host "HEALTH : $health"
Write-Host "PING   : $ping"

if ($home -eq 200 -and $health -in 200,204 -and $ping -in 200,204) {
  Write-Host "SMOKE: PASS ✅"; exit 0
} else {
  Write-Host "SMOKE: FAIL ❌"; exit 1
}
