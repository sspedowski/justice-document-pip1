param(
  [switch]$Apply,
  [string[]]$Roots = @('justice-dashboard\src')
)

Write-Host "Scanning for raw fetch() usages..." -ForegroundColor Cyan

$files = @()
foreach ($root in $Roots) {
  if (-not (Test-Path $root)) { continue }
  $files += Get-ChildItem -Path $root -Recurse -Include *.js,*.jsx,*.ts,*.tsx |
    Where-Object {
      $_.FullName -notmatch "legacy\\" -and $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "lib\\auth-fetch\.js$"
    }
}

$changed = @()
foreach ($f in $files) {
  $text = Get-Content -Raw -Path $f.FullName
  if ($text -notmatch "\bfetch\("
      -or $text -match "\bauthFetch\(") { continue }

  # naive guard: skip common words ending with fetch (e.g., authFetch)
  $new = $text -replace "(?<![A-Za-z0-9_])fetch\(", 'authFetch('
  if ($new -ne $text) {
    $changed += [pscustomobject]@{ File=$f.FullName; Replaced=$((Select-String -InputObject $text -Pattern "(?<![A-Za-z0-9_])fetch\(" -AllMatches).Matches.Count) }
    if ($Apply) {
      # write .bak once
      $bak = "$($f.FullName).bak"
      if (-not (Test-Path $bak)) { Set-Content -Path $bak -Value $text -Encoding UTF8 }
      Set-Content -Path $f.FullName -Value $new -Encoding UTF8
    }
  }
}

if ($changed.Count -eq 0) {
  Write-Host "No raw fetch() usages found that need changes." -ForegroundColor Green
  exit 0
}

$changed | ForEach-Object { Write-Host ("{0} -> replaced {1}" -f $_.File, $_.Replaced) }

if (-not $Apply) {
  Write-Host "\nDry run. Re-run with -Apply to write changes." -ForegroundColor Yellow
  Write-Host "Note: Ensure you import { authFetch } from the appropriate path in files you modify." -ForegroundColor Yellow
} else {
  Write-Host "\nApplied replacements. You may need to add imports for authFetch:" -ForegroundColor Green
  Write-Host "  import { authFetch } from '../lib/auth-fetch.js'  (adjust the relative path per file)"
}

