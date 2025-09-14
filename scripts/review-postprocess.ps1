param(
  [string]$MasterCsv = "evidence\master_review.csv",
  [string]$DupCsv    = "evidence\duplicates.csv"
)

$ErrorActionPreference = 'Stop'

function Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Done($msg) { Write-Host $msg -ForegroundColor Green }
function Warn($msg) { Write-Host $msg -ForegroundColor Yellow }

if (-not (Test-Path -LiteralPath $MasterCsv)) { throw "Master CSV not found: $MasterCsv" }
if (-not (Test-Path -LiteralPath $DupCsv))    { throw "Duplicates CSV not found: $DupCsv" }

# 1) Quick verify and head
Info "[1/5] Verify outputs"
$existsMaster = Test-Path -LiteralPath $MasterCsv
$existsDup    = Test-Path -LiteralPath $DupCsv
Write-Host "Exists master: $existsMaster  |  duplicates: $existsDup"

$masterLines = (Get-Content -LiteralPath $MasterCsv).Count
Write-Host "Master rows (including header): $masterLines"
Write-Host "Head (first 10 lines):"
(Get-Content -LiteralPath $MasterCsv -TotalCount 10) | ForEach-Object { Write-Host $_ }

# 2) Extreme priority extraction
Info "[2/5] Extract extreme priority rows"
$extreme = Import-Csv -LiteralPath $MasterCsv | Where-Object { $_.extreme_flags -ne "" }
$extremeOut = "evidence\extreme_priority.csv"
$extreme | Sort-Object -Property extreme_flags, modified -Descending | Export-Csv -NoTypeInformation -Encoding UTF8 $extremeOut
$extremeCount = ($extreme | Measure-Object).Count
Write-Host "Extreme rows: $extremeCount  -> $extremeOut"

# 3) Duplicates plan (KEEP vs ARCHIVE) — safe only, no moves
Info "[3/5] Build duplicates plan (no moves)"
$dupGroups = Import-Csv -LiteralPath $DupCsv | Group-Object sha256
$plan = foreach ($g in $dupGroups) {
  $keep = $g.Group | Sort-Object {[int64]$_.size_bytes} -Descending | Select-Object -First 1
  foreach ($f in $g.Group) {
    [pscustomobject]@{
      Action   = if ($f.rel_path -eq $keep.rel_path) { "KEEP" } else { "ARCHIVE" }
      rel_path = $f.rel_path
      size     = $f.size_bytes
      sha256   = $f.sha256
      category_guess = $f.category_guess
      extreme_flags  = $f.extreme_flags
    }
  }
}
$planOut = "evidence\duplicates_plan.csv"
$plan | Export-Csv -NoTypeInformation -Encoding UTF8 $planOut
$planArchiveCount = ($plan | Where-Object { $_.Action -eq 'ARCHIVE' } | Measure-Object).Count
Write-Host "Duplicates groups: $($dupGroups.Count)  |  ARCHIVE candidates: $planArchiveCount  -> $planOut"

# 4) Non-procedural filtered CSV
Info "[4/5] Non-procedural filter"
$nonProcOut = "evidence\master_review_nonprocedural.csv"
Import-Csv -LiteralPath $MasterCsv |
  Where-Object { $_.suggested_inclusion -ne "NO - Procedural only" } |
  Export-Csv -NoTypeInformation -Encoding UTF8 $nonProcOut
Write-Host "Non-procedural exported -> $nonProcOut"

# 5) OCR check heuristic (PDFs with page counts)
Info "[5/5] OCR check heuristic"
$ocrOut = "evidence\needs_ocr_check.csv"
Import-Csv -LiteralPath $MasterCsv |
  Where-Object { $_.file_type -eq "pdf" -and [int]$_.pages_or_len -gt 0 } |
  Select-Object rel_path, pages_or_len, category_guess, extreme_flags |
  Export-Csv -NoTypeInformation -Encoding UTF8 $ocrOut
Write-Host "OCR check exported -> $ocrOut"

Done "All set. Review CSVs under evidence/"
