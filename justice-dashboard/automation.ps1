# Justice Dashboard Automation Scripts
# PowerShell version for Windows users

Write-Host "Justice Dashboard Automation Scripts" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

function Show-Menu {
    Write-Host "Please select an option:" -ForegroundColor Yellow
    Write-Host "1. Extract environment variables"
    Write-Host "2. Clean up and restructure project"
    Write-Host "3. Run linting"
    Write-Host "4. Format code"
    Write-Host "5. Update PDF links"
    Write-Host "6. Install dependencies"
    Write-Host "7. Exit"
    Write-Host ""
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
        Get-ChildItem -Path "." -Filter "*.lnk" | Remove-Item -Force
        Get-ChildItem -Path "." -Filter "*backup*.sh" | Remove-Item -Force
        
        Write-Host "Creating frontend and backend directories..."
        if (!(Test-Path "frontend")) { New-Item -ItemType Directory -Name "frontend" }
        if (!(Test-Path "backend")) { New-Item -ItemType Directory -Name "backend" }
        
        Write-Host "Moving server files to backend..."
        if (Test-Path "server") {
            Get-ChildItem "server" | Move-Item -Destination "backend" -Force
            Remove-Item "server" -Recurse -Force
        }
        
        Write-Host "Moving client files to frontend..."
        if (Test-Path "client") {
            Get-ChildItem "client" | Move-Item -Destination "frontend" -Force
            Remove-Item "client" -Recurse -Force
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
    Write-Host "Available PDF files:" -ForegroundColor Yellow
    
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
        Write-Host "No PDF files found in common locations." -ForegroundColor Red
        Write-Host "Expected locations: server\uploads\, uploads\, current directory" -ForegroundColor Yellow
    } else {
        for ($i = 0; $i -lt [Math]::Min($foundPdfs.Count, 5); $i++) {
            Write-Host "  $($i + 1). $($foundPdfs[$i])" -ForegroundColor Cyan
        }
        if ($foundPdfs.Count -gt 5) {
            Write-Host "  ... and $($foundPdfs.Count - 5) more files" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    $inputFile = Read-Host "Enter input PDF file path (copy from above or type custom path)"
    $outputFile = Read-Host "Enter output PDF file path (or press Enter for default)"
    
    if ([string]::IsNullOrWhiteSpace($outputFile)) {
        $outputFile = "MCL, Federal Law- Misconduct Analysis (2).pdf"
    }
    
    Write-Host "Processing PDF..." -ForegroundColor Green
    python update_pdf_links.py "$inputFile" "$outputFile"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PDF processing completed successfully!" -ForegroundColor Green
        Write-Host "Output saved as: $outputFile" -ForegroundColor Cyan
    } else {
        Write-Host "PDF processing failed!" -ForegroundColor Red
    }
}

function Install-Dependencies {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Green
    npm install
    
    Write-Host "Installing Python dependencies..." -ForegroundColor Green
    python -m pip install PyPDF2
    
    Write-Host "Dependencies installation completed!" -ForegroundColor Green
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-7)"
    
    switch ($choice) {
        "1" { Extract-Environment }
        "2" { Cleanup-Project }
        "3" { Run-Linting }
        "4" { Format-Code }
        "5" { Update-PDFLinks }
        "6" { Install-Dependencies }
        "7" { 
            Write-Host "Goodbye!" -ForegroundColor Cyan
            exit 
        }
        default { 
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red 
        }
    }
    
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Clear-Host
    
} while ($choice -ne "7")
