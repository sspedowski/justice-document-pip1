# Justice Dashboard Automation Scripts
# PowerShell version for Windows users

Write-Host "Justice Dashboard Automation Scripts" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Quick system check
function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    $nodeVersion = try { node --version } catch { $null }
    $pythonVersion = try { python --version } catch { $null }
    $npmVersion = try { npm --version } catch { $null }
    
    if ($nodeVersion) {
        Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] Node.js not found - install from nodejs.org" -ForegroundColor Red
    }
    
    if ($npmVersion) {
        Write-Host "[OK] npm: v$npmVersion" -ForegroundColor Green
    }
    
    if ($pythonVersion) {
        Write-Host "[OK] Python: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] Python not found - install from python.org" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Show-Menu {
    Clear-Host
    Write-Host "Justice Dashboard Automation Scripts" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please select an option:" -ForegroundColor Yellow
    Write-Host "1. Extract environment variables" -ForegroundColor White
    Write-Host "2. Clean up and restructure project" -ForegroundColor White
    Write-Host "3. Run linting" -ForegroundColor White
    Write-Host "4. Format code" -ForegroundColor White
    Write-Host "5. Update PDF links" -ForegroundColor White
    Write-Host "6. Install dependencies" -ForegroundColor White
    Write-Host "7. Quick setup (runs 1,6,3,4)" -ForegroundColor Green
    Write-Host "8. Show project status" -ForegroundColor Cyan
    Write-Host "9. Show help guide" -ForegroundColor Magenta
    Write-Host "0. Exit" -ForegroundColor Red
    Write-Host ""
    Write-Host "TIP: Enter only the number, no extra text" -ForegroundColor Gray
}

function Extract-Environment {
    Write-Host "Running environment variable extraction..." -ForegroundColor Green
    node extract-env.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Environment extraction completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Environment extraction failed!" -ForegroundColor Red
    }
}

function Cleanup-Project {
    Write-Host "Running project cleanup and restructuring..." -ForegroundColor Green
    
    # Check if Git Bash is available
    $gitBash = Get-Command "bash" -ErrorAction SilentlyContinue
    if ($gitBash) {
        bash cleanup-and-structure.sh
    } else {
        Write-Host "Git Bash not found. Running PowerShell equivalent..." -ForegroundColor Yellow
        
        # PowerShell equivalent of the bash script
        Write-Host "Removing Windows shortcuts and backup scripts..."
        Get-ChildItem -Path "." -Filter "*.lnk" | Remove-Item -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path "." -Filter "*backup*.sh" | Remove-Item -Force -ErrorAction SilentlyContinue
        
        Write-Host "Creating frontend and backend directories..."
        if (!(Test-Path "frontend")) { New-Item -ItemType Directory -Name "frontend" | Out-Null }
        if (!(Test-Path "backend")) { New-Item -ItemType Directory -Name "backend" | Out-Null }
        
        Write-Host "Moving server files to backend..."
        if (Test-Path "server") {
            Get-ChildItem "server" | Move-Item -Destination "backend" -Force -ErrorAction SilentlyContinue
            Remove-Item "server" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "Moving client files to frontend..."
        if (Test-Path "client") {
            Get-ChildItem "client" | Move-Item -Destination "frontend" -Force -ErrorAction SilentlyContinue
            Remove-Item "client" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "Project restructuring completed!" -ForegroundColor Green
    }
}

function Run-Linting {
    Write-Host "Running ESLint..." -ForegroundColor Green
    npm run lint
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Linting completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Linting found issues. Run 'npm run lint:fix' to fix automatically." -ForegroundColor Yellow
    }
}

function Format-Code {
    Write-Host "Running Prettier..." -ForegroundColor Green
    npm run format
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Code formatting completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Code formatting failed!" -ForegroundColor Red
    }
}

function Update-PDFLinks {
    Write-Host "PDF Link Updater" -ForegroundColor Cyan
    Write-Host "================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Scanning for PDF files in common locations..." -ForegroundColor Yellow
    
    # Check for PDF files in common locations
    $pdfPaths = @("server\uploads", "uploads", ".")
    $foundPdfs = @()
    
    foreach ($path in $pdfPaths) {
        if (Test-Path $path) {
            $pdfs = Get-ChildItem "$path\*.pdf" -ErrorAction SilentlyContinue
            foreach ($pdf in $pdfs) {
                $foundPdfs += Join-Path $path $pdf.Name
            }
        }
    }
    
    if ($foundPdfs.Count -eq 0) {
        Write-Host "[ERROR] No PDF files found in common locations:" -ForegroundColor Red
        Write-Host "   - server\uploads\" -ForegroundColor Gray
        Write-Host "   - uploads\" -ForegroundColor Gray  
        Write-Host "   - current directory" -ForegroundColor Gray
        Write-Host ""
        Write-Host "TIP: You'll need to provide the full absolute path to your PDF file." -ForegroundColor Yellow
    } else {
        Write-Host "[FOUND] $($foundPdfs.Count) PDF file(s):" -ForegroundColor Green
        for ($i = 0; $i -lt [Math]::Min($foundPdfs.Count, 10); $i++) {
            $fileSize = try { (Get-Item $foundPdfs[$i]).Length / 1KB } catch { 0 }
            Write-Host "   $($i + 1). $($foundPdfs[$i]) ($([math]::Round($fileSize))KB)" -ForegroundColor Cyan
        }
        if ($foundPdfs.Count -gt 10) {
            Write-Host "   ... and $($foundPdfs.Count - 10) more files" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "TIP: Copy and paste one of the paths above, or enter a custom path." -ForegroundColor Yellow
    }
    
    Write-Host ""
    $inputFile = Read-Host "Enter input PDF file path"
    
    Write-Host ""
    Write-Host "Output options:" -ForegroundColor Yellow
    Write-Host "- Press Enter for default: MCL, Federal Law- Misconduct Analysis (2).pdf" -ForegroundColor Gray
    Write-Host "- Or type a custom name (e.g., C:\Reports\UpdatedMCL.pdf)" -ForegroundColor Gray
    $outputFile = Read-Host "Enter output PDF file path (or press Enter for default)"
    
    if ([string]::IsNullOrWhiteSpace($outputFile)) {
        $outputFile = "MCL, Federal Law- Misconduct Analysis (2).pdf"
        Write-Host "Using default output: $outputFile" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Processing PDF..." -ForegroundColor Green
    Write-Host "Input:  $inputFile" -ForegroundColor Gray
    Write-Host "Output: $outputFile" -ForegroundColor Gray
    Write-Host ""
    
    python update_pdf_links.py "$inputFile" "$outputFile"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[SUCCESS] PDF processing completed successfully!" -ForegroundColor Green
        Write-Host "Output saved as: $outputFile" -ForegroundColor Cyan
        
        # Show file info if it exists
        if (Test-Path $outputFile) {
            $fileInfo = Get-Item $outputFile
            $fileSizeKB = [math]::Round($fileInfo.Length / 1KB)
            Write-Host "File size: $fileSizeKB KB" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "[ERROR] PDF processing failed!" -ForegroundColor Red
        Write-Host "Check that:" -ForegroundColor Yellow
        Write-Host "   - Input file path is correct" -ForegroundColor Gray
        Write-Host "   - Python and PyPDF2 are installed" -ForegroundColor Gray
        Write-Host "   - You have write permissions for the output location" -ForegroundColor Gray
    }
}

function Install-Dependencies {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Green
    npm install
    
    Write-Host "Installing Python dependencies..." -ForegroundColor Green
    python -m pip install PyPDF2
    
    Write-Host "Dependencies installation completed!" -ForegroundColor Green
}

function Show-ProjectStatus {
    Write-Host "Justice Dashboard Project Status" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check project structure
    $directories = @("client", "server", "frontend", "backend", "docs")
    Write-Host "Project Structure:" -ForegroundColor Yellow
    foreach ($dir in $directories) {
        if (Test-Path $dir) {
            $fileCount = (Get-ChildItem $dir -Recurse -File -ErrorAction SilentlyContinue).Count
            Write-Host "   [OK] $dir/ ($fileCount files)" -ForegroundColor Green
        } else {
            Write-Host "   [MISSING] $dir/ (not found)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # Check for key files
    $keyFiles = @("package.json", ".env", ".env.example", ".eslintrc.js", ".prettierrc")
    Write-Host "Key Files:" -ForegroundColor Yellow
    foreach ($file in $keyFiles) {
        if (Test-Path $file) {
            Write-Host "   [OK] $file" -ForegroundColor Green
        } else {
            Write-Host "   [MISSING] $file" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # Check PDF files
    $pdfCount = 0
    if (Test-Path "server\uploads") {
        $pdfCount = (Get-ChildItem "server\uploads\*.pdf" -ErrorAction SilentlyContinue).Count
    }
    Write-Host "Legal Documents:" -ForegroundColor Yellow
    Write-Host "   PDF files in uploads: $pdfCount" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "TIP: Use other menu options to set up missing components." -ForegroundColor Gray
}

function Show-HelpGuide {
    Write-Host "Justice Dashboard Help Guide" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Quick Start:" -ForegroundColor Yellow
    Write-Host "   1. Install dependencies (Option 6)" -ForegroundColor White
    Write-Host "   2. Extract environment variables (Option 1)" -ForegroundColor White
    Write-Host "   3. Check project status (Option 8)" -ForegroundColor White
    Write-Host "   4. Process PDFs as needed (Option 5)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "File Locations:" -ForegroundColor Yellow
    Write-Host "   - Configuration: .env, package.json" -ForegroundColor White
    Write-Host "   - Legal PDFs: server/uploads/" -ForegroundColor White
    Write-Host "   - Documentation: *.md files" -ForegroundColor White
    Write-Host "   - Scripts: *.js, *.ps1, *.sh files" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   - Check COMPREHENSIVE_WINDOWS_GUIDE.md" -ForegroundColor White
    Write-Host "   - Check QUICK_FIX_GUIDE.md" -ForegroundColor White
    Write-Host "   - Ensure you're in: justice-dashboard/justice-dashboard/" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Common Issues:" -ForegroundColor Yellow
    Write-Host "   - 'Command not found' -> Install Node.js, Python, or Git" -ForegroundColor White
    Write-Host "   - 'No PDFs found' -> Check server/uploads/ folder" -ForegroundColor White
    Write-Host "   - 'Permission denied' -> Run as administrator" -ForegroundColor White
}

function Run-QuickSetup {
    Write-Host "Quick Setup for Justice Dashboard" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "This will run the essential setup steps automatically." -ForegroundColor Yellow
    Write-Host "Steps: Install dependencies -> Extract env vars -> Run lint/format" -ForegroundColor Gray
    Write-Host ""
    
    $confirm = Read-Host "Continue with quick setup? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Write-Host ""
        Write-Host "Running quick setup..." -ForegroundColor Green
        
        # Step 1: Install dependencies
        Write-Host ""
        Write-Host "Step 1/4: Installing dependencies..." -ForegroundColor Yellow
        Install-Dependencies
        
        # Step 2: Extract environment variables  
        Write-Host ""
        Write-Host "Step 2/4: Extracting environment variables..." -ForegroundColor Yellow
        Extract-Environment
        
        # Step 3: Run linting
        Write-Host ""
        Write-Host "Step 3/4: Running code linting..." -ForegroundColor Yellow
        Run-Linting
        
        # Step 4: Format code
        Write-Host ""
        Write-Host "Step 4/4: Formatting code..." -ForegroundColor Yellow
        Format-Code
        
        Write-Host ""
        Write-Host "[SUCCESS] Quick setup completed!" -ForegroundColor Green
        Write-Host "Your Justice Dashboard is now ready for development." -ForegroundColor Cyan
    } else {
        Write-Host "Quick setup cancelled." -ForegroundColor Gray
    }
}

# Run prerequisite check on startup
Test-Prerequisites

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (0-9)"
    
    switch ($choice) {
        "1" { Extract-Environment }
        "2" { Cleanup-Project }
        "3" { Run-Linting }
        "4" { Format-Code }
        "5" { Update-PDFLinks }
        "6" { Install-Dependencies }
        "7" { Run-QuickSetup }
        "8" { Show-ProjectStatus }
        "9" { Show-HelpGuide }
        "0" { 
            Write-Host ""
            Write-Host "Thank you for using Justice Dashboard Automation!" -ForegroundColor Cyan
            Write-Host "Your legal document management system is ready." -ForegroundColor Green
            Write-Host ""
            break
        }
        default { 
            Write-Host ""
            Write-Host "[ERROR] Invalid choice. Please enter a number from 0-9." -ForegroundColor Red
        }
    }
    
    if ($choice -ne "0") {
        Write-Host ""
        Write-Host "Press any key to continue..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    
} while ($choice -ne "0")
