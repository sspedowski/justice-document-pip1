param(
  [int]$Port = 3020,
  [int]$TimeoutSec = 120
)

function Write-Header($t){ Write-Host "`n=== $t ===" -ForegroundColor Cyan }

Write-Header "Node"
try { $nodev = node -v; Write-Host "node -v -> $nodev" } catch { Write-Host "Node not found in PATH. Install Node 20 LTS." -ForegroundColor Yellow }

Write-Header "Install"
if (Test-Path package-lock.json) { Write-Host "Lockfile present -> npm ci"; npm ci } else { Write-Host "No lockfile -> npm install"; npm install }

Write-Header "Start dev"
$env:PORT = "$Port"
$proc = Start-Process -FilePath "npm" -ArgumentList "run","dev" -PassThru
Start-Sleep -Milliseconds 500

Write-Header "Wait for server"
$deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSec)
$healthOk = $false
while([DateTime]::UtcNow -lt $deadline){
  try { $resp = Invoke-WebRequest "http://localhost:$Port/api/health" -TimeoutSec 5 -ErrorAction Stop; if ($resp.StatusCode -eq 200) { $healthOk = $true; break } } catch { Start-Sleep -Milliseconds 500 }
}
if(-not $healthOk){ Write-Host "Server did not become healthy within $TimeoutSec seconds." -ForegroundColor Red; if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force }; exit 1 }
Write-Host "Health endpoint returned 200." -ForegroundColor Green

Write-Header "Probes"
try { $r = Invoke-WebRequest "http://localhost:$Port/" -MaximumRedirection 0 -ErrorAction SilentlyContinue; "{0,-22} {1} -> {2}" -f "ROOT", $r.StatusCode, $r.Headers.Location } catch { "{0,-22} {1}" -f "ROOT", $_.Exception.Message }
try { $r = Invoke-WebRequest "http://localhost:$Port/dashboard" -MaximumRedirection 0 -ErrorAction SilentlyContinue; "{0,-22} {1} -> {2}" -f "/dashboard", $r.StatusCode, $r.Headers.Location } catch { "{0,-22} {1}" -f "/dashboard", $_.Exception.Message }
try { $r = Invoke-WebRequest "http://localhost:$Port/dashboard/" -ErrorAction Stop; "{0,-22} {1} (bytes {2})" -f "/dashboard/", $r.StatusCode, $r.RawContentLength } catch { "{0,-22} {1}" -f "/dashboard/", $_.Exception.Message }
try { $h = Invoke-RestMethod "http://localhost:$Port/api/health" -ErrorAction Stop; "{0,-22} {1}" -f "/api/health", ($h | ConvertTo-Json -Compress) } catch { "{0,-22} {1}" -f "/api/health", $_.Exception.Message }
try { $p = Invoke-RestMethod "http://localhost:$Port/api/rtdb/ping" -ErrorAction Stop; "{0,-22} {1}" -f "/api/rtdb/ping", ($p | ConvertTo-Json -Compress) } catch { "{0,-22} {1}" -f "/api/rtdb/ping", $_.Exception.Message }

if ($proc -and !$proc.HasExited) { Write-Header "Stop dev"; Stop-Process -Id $proc.Id -Force; Write-Host "Stopped dev server (PID $($proc.Id))." }
Write-Host "`nSmoke test complete." -ForegroundColor Green
