param(
  [Parameter(Mandatory = $true)]
  [string]$ZipPath,

  [string]$TargetRoot = "evidence",

  [switch]$AutoMoveNonDuplicates = $false
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host $msg -ForegroundColor Red }

# Validate inputs
if (-not (Test-Path $ZipPath)) {
  Write-Err "ZIP not found: $ZipPath"
  exit 1
}

$repoRoot = (Resolve-Path .).Path
$evidenceRoot = Join-Path $repoRoot $TargetRoot
$inboxDir = Join-Path $evidenceRoot "_INBOX"
$keepDir = Join-Path $evidenceRoot "KEEP"
$archiveDir = Join-Path $evidenceRoot "ARCHIVE"

# Ensure structure exists
$null = New-Item -ItemType Directory -Force -Path $evidenceRoot, $inboxDir, $keepDir, $archiveDir

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$workDir = Join-Path $inboxDir "import_$ts"
$null = New-Item -ItemType Directory -Force -Path $workDir

Write-Info "Extracting ZIP to $workDir"
Expand-Archive -Path $ZipPath -DestinationPath $workDir -Force

# Build hash index for existing evidence KEEP + ARCHIVE
Write-Info "Indexing existing evidence (KEEP + ARCHIVE)..."
$existing = @{}
Get-ChildItem -Recurse -File -Path $keepDir, $archiveDir -ErrorAction SilentlyContinue | ForEach-Object {
  try {
    $h = Get-FileHash -Algorithm SHA256 -Path $_.FullName
    $existing[$h.Hash] = $_.FullName
  } catch {
    Write-Warn "Hash failed: $($_.FullName) - $($_.Exception.Message)"
  }
}

# Now hash imported files
Write-Info "Hashing imported files..."
$report = @()
Get-ChildItem -Recurse -File -Path $workDir | ForEach-Object {
  $src = $_.FullName
  try {
    $h = Get-FileHash -Algorithm SHA256 -Path $src
    $hash = $h.Hash
  } catch {
    Write-Warn "Hash failed: $src - $($_.Exception.Message)"; return
  }
  $size = $_.Length
  $rel  = $src.Substring($repoRoot.Length).TrimStart('\\','/')
  $duplicateOf = $null
  $isDuplicate = $false
  if ($existing.ContainsKey($hash)) {
    $duplicateOf = $existing[$hash]
    $isDuplicate = $true
  }

  $dest = $null
  if (-not $isDuplicate -and $AutoMoveNonDuplicates) {
    # Normalize filename to YYYY-MM-DD_slug.ext if possible (keep original if no date found)
    $name = $_.Name
    $ext = [IO.Path]::GetExtension($name)
    $base = [IO.Path]::GetFileNameWithoutExtension($name)
    $dateMatch = [regex]::Match($base, '(19|20)\d{2}[-_]?\d{2}[-_]?\d{2}')
    if ($dateMatch.Success) {
      $date = $dateMatch.Value -replace '_','-'
      $slug = ($base -replace $dateMatch.Value,'').Trim(' -_')
      if ([string]::IsNullOrWhiteSpace($slug)) { $slug = 'document' }
      $norm = "${date}_$slug$ext"
    } else {
      $norm = $name
    }
    $dest = Join-Path $keepDir $norm
    try {
      Copy-Item -Path $src -Destination $dest -Force
    } catch {
      Write-Warn "Copy failed to KEEP: $src -> $dest : $($_.Exception.Message)"
    }
  }

  $report += [PSCustomObject]@{
    ImportedPath = $rel
    SHA256       = $hash
    SizeBytes    = $size
    IsDuplicate  = $isDuplicate
    DuplicateOf  = $duplicateOf
    MovedTo      = $dest
  }
}

$reportDir = Join-Path $evidenceRoot "reports"
$null = New-Item -ItemType Directory -Force -Path $reportDir
$csv = Join-Path $reportDir "import-report_$ts.csv"
$json = Join-Path $reportDir "import-report_$ts.json"
$report | Export-Csv -NoTypeInformation -Path $csv
$report | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $json

Write-Info "Done. Report written to:`n  $csv`n  $json"
Write-Info "Imported files remain in: $workDir"
if (-not $AutoMoveNonDuplicates) {
  Write-Info "Non-duplicates not moved (safe default). Use -AutoMoveNonDuplicates to copy to KEEP automatically."
}
