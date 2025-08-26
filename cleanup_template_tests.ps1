# cleanup_template_tests.ps1
param([string]$RepoPath = ".")
Set-Location $RepoPath
$targets = @(
  "tests",
  "test-build.html",
  "test-app.sh",
  "test-summary.sh",
  "test-comparison.sh",
  "validate-build.sh",
  "TEST_REPORT.md",
  "create_sample_pdfs.py",
  "create_sample_text_docs.py"
)
foreach ($t in $targets) {
  if (Test-Path $t) {
    Write-Host "Removing $t"
    git rm -r -f -- $t 2>$null
  }
}
git commit -m "chore: remove Spark template tests/demos" || Write-Host "Nothing to commit"
Write-Host "Done."
