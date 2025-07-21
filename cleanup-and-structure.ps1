# PowerShell alternative for cleanup-and-structure.sh
# Cleans up temp files and enforces folder structure for Justice Dashboard

Write-Host "🔍 Cleaning up temp files..."
Remove-Item -Path "justice-dashboard\temp\*" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Ensuring required folders exist..."
$folders = @(
    "justice-dashboard\Legal_Evidence",
    "justice-dashboard\Court_Orders",
    "justice-dashboard\Medical_Records",
    "justice-dashboard\frontend",
    "justice-dashboard\uploads"
)
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "Created: $folder"
    } else {
        Write-Host "Exists: $folder"
    }
}

Write-Host "🎉 Cleanup and structure enforcement complete!"
