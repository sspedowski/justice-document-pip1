$ErrorActionPreference = 'Stop'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$parent = (Resolve-Path '..').Path
$dest = Join-Path $parent ("REPO_BACKUP_" + $ts + ".zip")
Compress-Archive -Path . -DestinationPath $dest -Force
Write-Output ("Backup created: " + $dest)
