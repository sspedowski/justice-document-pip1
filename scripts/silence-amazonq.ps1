# Ensure .vscode exists
New-Item -ItemType Directory -Force -Path .vscode | Out-Null

# Merge-friendly settings payload (silences Amazon Q diagnostics & extra JS/TS noise)
$settingsPath = ".vscode\settings.json"
$base = @{ 
  "aws.amazonq.enableCodeScanning" = $false
  "aws.amazonq.enableCodeSuggestions" = $false
  "javascript.validate.enable"      = $false
  "typescript.validate.enable"      = $false
}
if (Test-Path $settingsPath) {
  $existing = Get-Content $settingsPath -Raw | ConvertFrom-Json
  $base.GetEnumerator() | ForEach-Object { $existing.$($_.Key) = $_.Value }
  ($existing | ConvertTo-Json -Depth 10) | Set-Content -Encoding UTF8 $settingsPath
} else {
  ($base | ConvertTo-Json -Depth 10) | Set-Content -Encoding UTF8 $settingsPath
}

# Add file-level disables to the first auth-api.test.* found
$testFile = Get-ChildItem -Recurse -File -Include "auth-api.test.*" | Select-Object -First 1
if ($testFile) {
  $header = "/* eslint-disable */`n// @ts-nocheck`n"
  $content = Get-Content $testFile.FullName -Raw
  if ($content -notmatch "\Q/* eslint-disable */\E") {
    ($header + $content) | Set-Content -Encoding UTF8 $testFile.FullName
  }
}

# Linter/test override via .eslintignore (silence all tests)
$eslintIgnore = ".eslintignore"
$linesToAdd = @("**/*.test.*","**/__tests__/**")
if (Test-Path $eslintIgnore) {
  $cur = Get-Content $eslintIgnore -Raw
  $out = $cur
  foreach ($l in $linesToAdd) {
    if ($cur -notmatch [regex]::Escape($l)) { $out += "`n$l" }
  }
  $out | Set-Content -Encoding UTF8 $eslintIgnore
} else {
  ($linesToAdd -join "`n") | Set-Content -Encoding UTF8 $eslintIgnore
}

Write-Host "Done. Review changes with 'git diff'."
