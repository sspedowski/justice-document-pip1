# PowerShell equivalent of cleanup-and-structure.sh
# cleanup-and-structure.ps1

Write-Host "Starting project cleanup and restructuring..." -ForegroundColor Cyan

# 1. Remove *.lnk and backup scripts
Write-Host "Removing Windows shortcuts and backup scripts..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "*.lnk" | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "." -Filter "*backup*.sh" | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "Removed Windows shortcuts and backup scripts." -ForegroundColor Green

# 2. Create frontend and backend directories, move files
Write-Host "Creating frontend and backend directories..." -ForegroundColor Yellow

# Create directories if they don't exist
if (!(Test-Path "frontend")) { 
    New-Item -ItemType Directory -Name "frontend" | Out-Null
    Write-Host "Created frontend directory" -ForegroundColor Green
}

if (!(Test-Path "backend")) { 
    New-Item -ItemType Directory -Name "backend" | Out-Null
    Write-Host "Created backend directory" -ForegroundColor Green
}

# Move server files to backend
Write-Host "Moving server files to backend..." -ForegroundColor Yellow
if (Test-Path "server") {
    try {
        Get-ChildItem "server\*" | Move-Item -Destination "backend" -Force -ErrorAction Stop
        Remove-Item "server" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Moved server files to backend/" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Could not move all server files: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Move client files to frontend
Write-Host "Moving client files to frontend..." -ForegroundColor Yellow
if (Test-Path "client") {
    try {
        Get-ChildItem "client\*" | Move-Item -Destination "frontend" -Force -ErrorAction Stop
        Remove-Item "client" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Moved client files to frontend/" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Could not move all client files: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Move any existing public, src directories
if (Test-Path "public") {
    Move-Item "public" "frontend\" -Force -ErrorAction SilentlyContinue
    Write-Host "Moved public directory to frontend/" -ForegroundColor Green
}

if (Test-Path "src") {
    Move-Item "src" "frontend\" -Force -ErrorAction SilentlyContinue
    Write-Host "Moved src directory to frontend/" -ForegroundColor Green
}

# Copy package.json to frontend if it doesn't exist there
if ((Test-Path "package.json") -and !(Test-Path "frontend\package.json")) {
    Copy-Item "package.json" "frontend\" -Force
    Write-Host "Copied package.json to frontend/" -ForegroundColor Green
}

# Move yarn.lock if it exists
if (Test-Path "yarn.lock") {
    Move-Item "yarn.lock" "frontend\" -Force -ErrorAction SilentlyContinue
    Write-Host "Moved yarn.lock to frontend/" -ForegroundColor Green
}

Write-Host "Reorganized project into frontend/ and backend/." -ForegroundColor Green

# 3. Create basic directory structure for documentation
Write-Host "Ensuring proper directory structure..." -ForegroundColor Yellow

$directories = @("docs", "scripts", "config")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Name $dir | Out-Null
        Write-Host "Created $dir directory" -ForegroundColor Green
    }
}

Write-Host "Project restructuring complete!" -ForegroundColor Cyan
Write-Host "Frontend files are now in: .\frontend\" -ForegroundColor White
Write-Host "Backend files are now in: .\backend\" -ForegroundColor White
Write-Host "Documentation is organized in existing folders and .\docs\" -ForegroundColor White
