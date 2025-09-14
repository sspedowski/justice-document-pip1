$ErrorActionPreference = 'Stop'
# Scan for common secret patterns; mask with **** except last 4 chars
$patterns = @(
  'OPENAI_API_KEY','JWT_SECRET','SESSION_SECRET','AI_GATEWAY_API_KEY','sk-[A-Za-z0-9]+'
)
$regex = [string]::Join('|', $patterns)
$results = git grep -n --perl-regexp $regex 2>$null
if (-not $results) {
  Write-Output 'No obvious secrets found via quick scan.'
  exit 0
}
$results -split "`n" | ForEach-Object {
  if ($_ -match '^(?<file>[^:]+):(?<line>\d+):(?<content>.*)$') {
    $file=$Matches['file']; $line=$Matches['line']; $content=$Matches['content']
    $masked = [regex]::Replace($content, '([A-Za-z0-9_]*?(OPENAI_API_KEY|JWT_SECRET|SESSION_SECRET|AI_GATEWAY_API_KEY|sk-[A-Za-z0-9]+)[A-Za-z0-9_\-]*?)([A-Za-z0-9]{0,})([A-Za-z0-9]{4})', '$1****$4')
    Write-Output ("{0}:{1}:{2}" -f $file,$line,$masked)
  } else {
    Write-Output $_
  }
}
