# review_all.ps1 — runs the analyzer safely from the current directory
param(
  [string]$Root = ".",
  [string]$OutMaster = "master_review.csv",
  [string]$OutDups = "duplicates.csv"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -Path "analyze_docs.py")) {
  Write-Error "analyze_docs.py not found in current directory. Save the script here first."
}

Write-Host "[1/3] Python deps check/install" -ForegroundColor Cyan
py -m pip install --quiet PyPDF2 python-docx | Out-Null

Write-Host "[2/3] Analyze" -ForegroundColor Cyan
py .\analyze_docs.py "$Root" "$OutMaster" "$OutDups"

Write-Host "[3/3] Done" -ForegroundColor Green
