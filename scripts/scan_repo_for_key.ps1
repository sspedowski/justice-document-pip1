Param(
  [string]$Pattern = 'client_email|private_key_id',
  [switch]$ShowContext
)
Write-Host '== Scanning repository for potential service account remnants ==' -ForegroundColor Cyan
$files = git ls-files
$hits = @()
foreach($f in $files){
  if(Test-Path $f){
    $lines = Get-Content -Raw -ErrorAction SilentlyContinue -Path $f | Select-String -Pattern $Pattern -AllMatches
    if($lines){
      $hits += [pscustomobject]@{ File=$f; Matches=$lines.Matches.Value -join ',' }
      if($ShowContext){ Write-Host "-- $f" -ForegroundColor Yellow; Get-Content -Path $f | Select-String -Pattern $Pattern }
    }
  }
}
if($hits.Count -eq 0){ Write-Host '✅ No occurrences found.' -ForegroundColor Green }
else {
  Write-Host '❌ Potential key remnants detected:' -ForegroundColor Red
  $hits | Format-Table -AutoSize
  exit 1
}
