$ErrorActionPreference = 'Stop'

# Label open PRs whose titles match upload/storage/signed URL/App Check
$prs = gh pr list --state open --json number,title | ConvertFrom-Json
$regex = '(upload|storage|signed url|app ?check)'
foreach ($pr in $prs) {
  if ($pr.title -match $regex) {
    Write-Host "Labeling PR #$($pr.number) by title"
    gh pr edit $pr.number --add-label "hardening,security" | Out-Null
  }
}

# Label open PRs by changed files
$prsFiles = gh pr list --state open --json number | ConvertFrom-Json
$paths = '(api/upload|upload|storage|signed|app-?check)'
foreach ($pr in $prsFiles) {
  $files = gh pr view $pr.number --json files --jq '.files[].path' | Out-String
  if ($files -match $paths) {
    Write-Host "Labeling PR #$($pr.number) by files"
    gh pr edit $pr.number --add-label "hardening,security" | Out-Null
  }
}

Write-Host 'label-backfill-done'

