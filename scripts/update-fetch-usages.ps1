param(
  [switch]$Apply,
  [switch]$AutoImport,
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

function Get-RelativeImportPath([string]$fromFile, [string]$toFile) {
  try {
    $fromDir = Split-Path -Parent (Resolve-Path -LiteralPath $fromFile)
    $toAbs   = (Resolve-Path -LiteralPath $toFile)
    $fromUri = New-Object System.Uri((Join-Path $fromDir ([IO.Path]::DirectorySeparatorChar)))
    $toUri   = New-Object System.Uri($toAbs)
    $rel     = $fromUri.MakeRelativeUri($toUri).ToString()
    if ($rel -notmatch '^(\.|\..)') { $rel = "./$rel" }
    return $rel -replace '\\', '/'
  } catch { return $null }
}

# Locate auth-fetch.js once
$authCandidates = @(
  Join-Path (Get-Location) 'justice-dashboard\src\lib\auth-fetch.js',
  Join-Path (Get-Location) 'src\lib\auth-fetch.js'
) | Where-Object { Test-Path $_ }
$authPath = $null
if ($authCandidates.Count -gt 0) { $authPath = $authCandidates[0] }

$changed = @()
foreach ($f in $files) {
  $text = Get-Content -Raw -Path $f.FullName
  if ($text -notmatch "\bfetch\(" -or $text -match "\bauthFetch\(") { continue }

  # Replace raw fetch with authFetch (naive, but avoids authFetch itself)
  $new = $text -replace "(?<![A-Za-z0-9_])fetch\(", 'authFetch('
  if ($new -ne $text) {
    $changed += [pscustomobject]@{ File=$f.FullName; Replaced=$((Select-String -InputObject $text -Pattern "(?<![A-Za-z0-9_])fetch\(" -AllMatches).Matches.Count) }
    if ($Apply) {
      # Backup once
      $bak = "$($f.FullName).bak"
      if (-not (Test-Path $bak)) { Set-Content -Path $bak -Value $text -Encoding UTF8 }

      # Optionally add import for authFetch
      if ($AutoImport -and $authPath) {
    $needsImport = ($new -notmatch 'import\s*\{\s*authFetch\s*\}\s*from\s*[\'\"].*auth-fetch(\.js)?[\'\"]')
        if ($needsImport) {
          $rel = Get-RelativeImportPath -fromFile $f.FullName -toFile $authPath
          if ($rel) {
            $lines = $new -split "`r?`n"
            $insertAt = 0
            $lastImport = -1
            for ($i=0; $i -lt $lines.Length; $i++) {
              $lt = $lines[$i].Trim()
              if ($lt -eq '') { continue }
              if ($lt -like 'import*') { $lastImport = $i; continue }
              break
            }
            if ($lastImport -ge 0) { $insertAt = $lastImport + 1 } else { $insertAt = 0 }
            $importLine = "import { authFetch } from '$rel';"
            if ($insertAt -eq 0) {
              $lines = @($importLine) + $lines
            } else {
              $lines = @($lines[0..($insertAt-1)] + $importLine + $lines[$insertAt..($lines.Length-1)])
            }
            $new = ($lines -join "`r`n")
          }
        }
      }

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
  if (-not $AutoImport) {
    Write-Host "\nApplied replacements. You may need to add imports for authFetch:" -ForegroundColor Green
    Write-Host "  import { authFetch } from '../lib/auth-fetch.js'  (adjust the relative path per file)"
  } else {
    Write-Host "\nApplied replacements and attempted to auto-insert imports for authFetch." -ForegroundColor Green
  }
}

