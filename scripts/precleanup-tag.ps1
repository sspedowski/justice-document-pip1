$ErrorActionPreference = 'Stop'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$tag = "pre-cleanup-" + $ts
try {
  git tag $tag | Out-Null
  Write-Output ("Created tag: " + $tag)
} catch {
  Write-Output ("Tag create failed: " + $_.Exception.Message)
}
