param(
  [string]$AppFolder = "justice-dashboard-next",
  [string]$Branch = "chore/move-next-to-root"
)

Write-Host "== Snapshot ==" -ForegroundColor Cyan
git remote -v
git status -s
git branch -vv

Write-Host "`n== Create branch from origin/main ==" -ForegroundColor Cyan
git fetch origin
git switch -C $Branch origin/main

if (-not (Test-Path $AppFolder)) {
  Write-Host "ERROR: $AppFolder not found. Run from repo root." -ForegroundColor Red
  exit 1
}

Write-Host "`n== Moving tracked files from $AppFolder -> / ==" -ForegroundColor Cyan
$tracked = git ls-files $AppFolder | ForEach-Object { $_.Trim() } | Where-Object { $_ }
foreach ($src in $tracked) {
  $dst = $src.Substring($AppFolder.Length + 1)
  if (-not $dst) { continue }
  $dstDir = Split-Path $dst -Parent
  if ($dstDir -and -not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force $dstDir | Out-Null }
  if (Test-Path $dst) {
    $ts = Get-Date -Format "yyyyMMdd-HHmmss"
    Write-Host "Destination exists; backing up $dst -> $dst.backup.$ts" -ForegroundColor Yellow
    git mv $dst "$dst.backup.$ts"
  }
  git mv $src $dst
}

if (Test-Path $AppFolder) {
  Write-Host "Removing leftover $AppFolder directory" -ForegroundColor Yellow
  Remove-Item -Recurse -Force $AppFolder -ErrorAction SilentlyContinue
  git add -A
}

# Ensure ignores
$ignoreLines = @("node_modules/", ".next/", ".vercel/", ".env", ".env.local", ".env.*.local")
if (Test-Path .gitignore) {
  $existing = Get-Content .gitignore
  foreach ($l in $ignoreLines) { if (-not ($existing -contains $l)) { Add-Content .gitignore "`n$l" } }
} else {
  ($ignoreLines -join "`n") + "`n" | Set-Content .gitignore
}
git add .gitignore

# Ensure engines.node >=18
if (Test-Path package.json) {
  node - <<'NODE'
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.engines = p.engines || {}; p.engines.node = p.engines.node || '>=18';
fs.writeFileSync('package.json', JSON.stringify(p,null,2)+'\n');
console.log('Ensured engines.node');
NODE
  git add package.json 2>$null
}

if (-not (Test-Path next.config.ts) -and -not (Test-Path next.config.js)) {
  Write-Host "Creating next.config.js" -ForegroundColor Yellow
  @"/** @type {import('next').NextConfig} */
const nextConfig = { output: 'standalone' };
module.exports = nextConfig;
"@ | Set-Content next.config.js
  git add next.config.js
}

if (Test-Path vercel.json) {
  Write-Host "Removing root vercel.json (now redundant)" -ForegroundColor Yellow
  git rm -f vercel.json
}

if (-not (Test-Path .nvmrc)) { '20' | Set-Content .nvmrc; git add .nvmrc }

Write-Host "`n== Commit & push ==" -ForegroundColor Cyan
git commit -m "chore(build): move Next app to repo root; update ignores & engines; prep for Vercel root deploy" || Write-Host "Nothing to commit" -ForegroundColor Yellow
git push -u origin $Branch
Write-Host "Done. Open PR: https://github.com/<YOUR_ORG_OR_USER>/<REPO>/compare/main...$Branch" -ForegroundColor Green