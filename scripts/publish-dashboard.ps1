# Builds the Vite dashboard and publishes it into Next's public/dashboard
param(
  [string]$VitePath = "./dashboard",
  [string]$AltPath = "./justice-dashboard",
  [string]$NextPublic = "./public/dashboard"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $VitePath) -and (Test-Path $AltPath)) {
  Write-Host "[publish-dashboard] Falling back to $AltPath"
  $VitePath = $AltPath
}

if (-not (Test-Path $VitePath)) {
  Write-Host "[publish-dashboard] No Vite source; skipping."
  exit 0
}

Push-Location $VitePath
    # PowerShell 5.1 can misparse inline logical operators in certain contexts; compute first, then decide.
    $hasPkgLock = Test-Path -Path "package-lock.json"
    $hasShrinkwrap = Test-Path -Path "npm-shrinkwrap.json"
    if ($hasPkgLock -or $hasShrinkwrap) {
      npm ci
    } else {
      npm install
    }
npm run build
Pop-Location

if (Test-Path $NextPublic) {
  Remove-Item $NextPublic -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $NextPublic | Out-Null
Copy-Item -Path (Join-Path $VitePath "dist/*") -Destination $NextPublic -Recurse -Force
Write-Host "[publish-dashboard] Published to $NextPublic"
