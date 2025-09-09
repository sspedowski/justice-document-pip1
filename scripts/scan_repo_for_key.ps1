Param(
  [string]$Pattern = 'client_email|private_key_id|BEGIN PRIVATE KEY|-----BEGIN PRIVATE KEY-----|firebase-adminsdk|robot/v1/metadata/x509',
  [switch]$ShowContext
)
Write-Host '== Scanning repository for potential service account remnants ==' -ForegroundColor Cyan
$files = git ls-files
$hits = @()
foreach($f in $files){
  if(Test-Path $f){
    $content = Get-Content -Raw -ErrorAction SilentlyContinue -Path $f
    if($null -ne $content){
      $lines = $content | Select-String -Pattern $Pattern -AllMatches
      if($lines){
        $hits += [pscustomobject]@{ File=$f; Matches=$lines.Matches.Value -join ',' }
        if($ShowContext){ Write-Host "-- $f" -ForegroundColor Yellow; $content | Select-String -Pattern $Pattern }
      }
    }
  }
}
if($hits.Count -eq 0){ Write-Host '✅ No occurrences found.' -ForegroundColor Green }
else {
  Write-Host '❌ Potential key remnants detected:' -ForegroundColor Red
  $hits | Format-Table -AutoSize
  exit 1
}

