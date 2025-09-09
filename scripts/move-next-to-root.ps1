param(
  [string]$AppFolder = 'justice-dashboard-next'
)

Write-Host '== Move Next App (Subfolder -> Root) ==' -ForegroundColor Cyan
if (-not (Test-Path $AppFolder)) { Write-Host "App folder '$AppFolder' not found" -ForegroundColor Red; exit 1 }

$tracked = git ls-files $AppFolder | ForEach-Object { $_.Trim() } | Where-Object { $_ }
if (-not $tracked) { Write-Host 'No tracked files found under app folder.' -ForegroundColor Yellow; exit 0 }

foreach ($src in $tracked) {
  if ($src -eq $AppFolder) { continue }
  $relative = $src.Substring($AppFolder.Length + 1)
  if ([string]::IsNullOrWhiteSpace($relative)) { continue }
  $dstDir = Split-Path $relative -Parent
  if ($dstDir -and -not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
  if (Test-Path $relative) {
    $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backup = "$relative.backup.$ts"
    Write-Host "Conflict: backing up existing $relative -> $backup" -ForegroundColor Yellow
    git mv $relative $backup
  }
  git mv $src $relative
}

if (Test-Path $AppFolder) { Remove-Item -Recurse -Force $AppFolder -ErrorAction SilentlyContinue }

# Ensure .nvmrc
if (-not (Test-Path '.nvmrc')) { '20' | Set-Content .nvmrc; git add .nvmrc }

# Ensure engines.node in package.json (now includes Next contents if moved separately prior)
if (Test-Path 'package.json') {
  try {
    $json = Get-Content package.json -Raw | ConvertFrom-Json
    if (-not $json.engines) { $json | Add-Member -NotePropertyName engines -NotePropertyValue @{ node = '>=18' } }
    elseif (-not $json.engines.node) { $json.engines.node = '>=18' }
    ($json | ConvertTo-Json -Depth 20) + "`n" | Set-Content package.json
    git add package.json
  } catch { Write-Host 'Skipping engines update (JSON parse failed)' -ForegroundColor Yellow }
}

# Ensure next.config.js or ts
if (-not (Test-Path 'next.config.ts') -and -not (Test-Path 'next.config.js')) {
  Write-Host 'Creating next.config.js with standalone output' -ForegroundColor Yellow
  @('/** @type {import("next").NextConfig} */','const nextConfig = { output: "standalone" };','module.exports = nextConfig;') | Set-Content next.config.js
  git add next.config.js
}

Write-Host 'Move complete (staged). Review with git status.' -ForegroundColor Green