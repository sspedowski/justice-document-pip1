param(
  [Parameter(Mandatory=$true)][int]$PrNumber,
  [string]$File = 'stabilization-checklist.md'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if (-not (Test-Path $File)) {
  Write-Error "Checklist file not found: $File"
}

try {
  & gh pr comment $PrNumber --body-file $File
} catch {
  Write-Error "Failed to post comment: $($_.Exception.Message)"
  exit 1
}

Write-Host "Posted stabilization checklist to PR #$PrNumber"
