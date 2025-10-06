param(
  [switch]$RewriteHistory = $false
)

$ErrorActionPreference = 'Stop'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'

Write-Host "[1/8] Backup" -ForegroundColor Cyan
try {
  Compress-Archive -Path . -DestinationPath (Join-Path .. "REPO_BACKUP_$ts.zip") -Force
} catch {
  Write-Warning "Backup failed: $($_.Exception.Message)"
}

Write-Host "[2/8] Git tag" -ForegroundColor Cyan
try {
  git tag "pre-cleanup-$ts"
  # Optional: push tags; comment out to avoid auth prompts
  # git push --tags
} catch {
  Write-Warning "Tagging failed: $($_.Exception.Message)"
}

Write-Host "[3/8] Ensure .gitignore" -ForegroundColor Cyan
@"
.env
.env.*
*.local
*.dev
node_modules/
.parcel-cache/
.next/
dist/
build/
coverage/
.turbo/
.vscode/
.idea/
.DS_Store
Thumbs.db
npm-debug.log*
yarn-error.log*
pnpm-debug.log*
*.log
"@ | Out-File -Encoding utf8 .gitignore

Write-Host "[4/8] Remove generated" -ForegroundColor Cyan
$toRemove = @('node_modules','dist','build','coverage','.next','.turbo','.parcel-cache')
foreach ($p in $toRemove) {
  if (Test-Path $p) {
    try { Remove-Item -Recurse -Force $p -ErrorAction Stop } catch { Write-Warning "Failed to remove $p: $($_.Exception.Message)" }
  }
}

Write-Host "[5/8] Reinstall" -ForegroundColor Cyan
try { npm install } catch { Write-Warning "npm install failed: $($_.Exception.Message)" }

Write-Host "[6/8] LFS track" -ForegroundColor Cyan
try {
  git lfs install | Out-Null
  $attrs = @(
    '*.pdf filter=lfs diff=lfs merge=lfs -text',
    '*.zip filter=lfs diff=lfs merge=lfs -text',
    '*.7z  filter=lfs diff=lfs merge=lfs -text',
    '*.mp4 filter=lfs diff=lfs merge=lfs -text',
    '*.mov filter=lfs diff=lfs merge=lfs -text',
    '*.psd filter=lfs diff=lfs merge=lfs -text',
    '*.ai  filter=lfs diff=lfs merge=lfs -text',
    '*.wav filter=lfs diff=lfs merge=lfs -text'
  )
  foreach ($a in $attrs) { Add-Content -Path .gitattributes -Value $a }
} catch { Write-Warning "Git LFS setup failed: $($_.Exception.Message)" }

Write-Host "[7/8] Duplicate index" -ForegroundColor Cyan
try {
  $out = @()
  Get-ChildItem -Recurse -File | ForEach-Object {
    $h = Get-FileHash -Algorithm SHA256 -Path $_.FullName
    $out += [PSCustomObject]@{Hash=$h.Hash; Size=$_.Length; Path=$_.FullName}
  }
  $dup = $out | Group-Object Hash | Where-Object { $_.Count -gt 1 }
  $dup | ForEach-Object { $_.Group } | Export-Csv -NoTypeInformation duplicates.csv
  Write-Host "Duplicate index written to duplicates.csv"
} catch { Write-Warning "Duplicate scan failed: $($_.Exception.Message)" }

if ($RewriteHistory) {
  Write-Host "[8/8] History rewrite (requires git-filter-repo installed)" -ForegroundColor Yellow
  try {
    git filter-repo --path .env --path-glob "*.zip" --invert-paths
  } catch { Write-Warning "History rewrite failed: $($_.Exception.Message)" }
}

Write-Host "Done. Review changes, commit, and push." -ForegroundColor Green
