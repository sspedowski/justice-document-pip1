param([switch]$Apply)
$ErrorActionPreference="Stop"

# Locate src and helper
$repo = (git rev-parse --show-toplevel 2>$null) -as [string]; if(!$repo){ $repo=(Get-Location).Path }
$src = @("justice-dashboard\src","src") | ForEach-Object { Join-Path $repo $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
if(!$src){ throw "Could not find a src folder (tried justice-dashboard\src and src from $repo)" }
$auth = Join-Path $src "lib\auth-fetch.js"; if(!(Test-Path $auth)){ throw "Missing helper: $auth" }

# Gather candidate files
$files = Get-ChildItem $src -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |
  Where-Object {
    $_.FullName -notmatch '\\(node_modules|dist|build|coverage|\.vite)\\' -and
    $_.FullName -notmatch '\\src\\lib\\' -and
    $_.Name -notmatch '\.test\.(js|jsx|ts|tsx)$'
  }

# Regex for raw fetch (exclude authFetch / obj.fetch)
$pattern = '(?<![\w$.])(?:window\.)?fetch\s*\('
$hits = foreach($f in $files){ Select-String -Path $f.FullName -Pattern $pattern -SimpleMatch:$false }

if(!$Apply){
  if(!$hits){ Write-Host "No fetch() usages found under $src"; exit 0 }
  $hits | ForEach-Object {
    "{0}:{1}: {2}" -f (Resolve-Path $_.Path -Relative), $_.LineNumber, ($_.Line.Trim())
  }
  Write-Host "`nRun with -Apply to rewrite and add imports."
  exit 0
}

# Helper to compute relative import from file to auth-fetch.js (JS style path)
function Get-ImportPath([string]$fromFile,[string]$toFile){
  $fromDir = (Split-Path $fromFile -Parent)
  $uFrom = New-Object Uri(($fromDir.TrimEnd('\')+'\\'))
  $uTo   = New-Object Uri($toFile)
  $rel = $uFrom.MakeRelativeUri($uTo).ToString().Replace('%5C','/').Replace('\\','/').Replace('%2E','.')
  $rel = $rel -replace '\.js$',''
  if($rel -notmatch '^\.' ){ $rel = './' + $rel }
  return $rel
}

$changed=@()
foreach($g in ($hits | Group-Object Path)){
  $file = $g.Name
  $text = Get-Content $file -Raw

  # Insert import if missing
  $importRe = 'from\s+["''].*?/auth-fetch["'']'
  if($text -notmatch $importRe){
    $imp = "import { authFetch } from '" + (Get-ImportPath $file $auth) + "';"
    # Put import at top (after shebang/comments if any)
    if($text -match '^(?:/\*[\s\S]*?\*/\s*|//.*\r?\n\s*)*'){
      $idx = $matches[0].Length
      $text = $text.Insert($idx, "$imp`r`n")
    } else {
      $text = "$imp`r`n$text"
    }
  }

  # Replace fetch calls with authFetch(
  $new = [regex]::Replace($text, $pattern, { param($m) "authFetch(" })

  if($new -ne $text){
    $new | Set-Content -Encoding UTF8 $file
    $changed += $file
  }
}

if($changed.Count){ & git add -- $changed }
Write-Host "Updated files: $($changed.Count)"; $changed | ForEach-Object { Write-Host (" - " + (Resolve-Path $_ -Relative)) }
