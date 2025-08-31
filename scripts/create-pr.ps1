$ErrorActionPreference = 'Stop'
$BR = 'chore/copilot-review'
$BASE = (git remote show origin | Select-String 'HEAD branch' | ForEach-Object { ($_ -split ':')[1].Trim() })
if (-not $BASE) { $BASE = 'main' }

# Ensure branch exists and is pushed
git fetch origin
try { git switch $BR } catch { git switch -c $BR }
git rebase "origin/$BR" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host 'Resolve conflicts (git add <file>; git rebase --continue)'; exit 1 }
git push --force-with-lease origin $BR

# Create draft PR
if (Get-Command gh -ErrorAction SilentlyContinue) {
  try {
    $title = 'Copilot repo review'
    $body = 'Copilot: run a full repo audit. Focus: build/run (npm run dev at 5174/3000), ESLint/TS, Vite/Tailwind/PostCSS, Express security (helmet/cors/rate-limit), GH Pages. Provide a checklist + unified diff patch sets.'
    $PR = gh pr create --draft -H $BR -B $BASE -t $title -b $body --json number -q .number
    gh pr comment $PR -b "/copilot review`nFocus: build/run (npm run dev:win @ 5174/3000); ESLint/TS config; Vite/Tailwind/PostCSS; Express security (helmet/cors/rate-limit); GH Pages.`nOutput: checklist + unified diff patch sets."
    gh pr view $PR -w
  } catch {
    $slug = (git remote get-url origin) -replace '.*github.com:/(?:.git)?$','$1'
    Write-Host "gh failed: $($_.Exception.Message)"
    Write-Host "Open manually: https://github.com/$slug/compare/$BASE...$BR?expand=1"
  }
} else {
  $slug = (git remote get-url origin) -replace '.*github.com:/(?:.git)?$','$1'
  Write-Host 'GitHub CLI not found. Install via: winget install GitHub.cli'
  Write-Host "Open to create PR: https://github.com/$slug/compare/$BASE...$BR?expand=1"
}
