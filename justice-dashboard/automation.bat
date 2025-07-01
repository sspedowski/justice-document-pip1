@echo off
echo Justice Dashboard Automation Scripts
echo ====================================
echo.

:menu
echo Please select an option:
echo 1. Extract environment variables
echo 2. Clean up and restructure project
echo 3. Run linting
echo 4. Format code
echo 5. Update PDF links
echo 6. Install dependencies
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if %choice%==1 goto extract_env
if %choice%==2 goto cleanup
if %choice%==3 goto lint
if %choice%==4 goto format
if %choice%==5 goto update_pdf
if %choice%==6 goto install_deps
if %choice%==7 goto exit
echo Invalid choice. Please try again.
goto menu

:extract_env
echo Running environment variable extraction...
node extract-env.js
pause
goto menu

:cleanup
echo Running project cleanup and restructuring...
bash cleanup-and-structure.sh
pause
goto menu

:lint
echo Running ESLint...
npm run lint
pause
goto menu

:format
echo Running Prettier...
npm run format
pause
goto menu

:update_pdf
set /p input_file="Enter input PDF file path: "
set /p output_file="Enter output PDF file path (or press Enter for default): "
if "%output_file%"=="" set output_file=MCL, Federal Law- Misconduct Analysis (2).pdf
echo Processing PDF...
python update_pdf_links.py "%input_file%" "%output_file%"
pause
goto menu

:install_deps
echo Installing Node.js dependencies...
npm install
echo Installing Python dependencies...
pip install PyPDF2
pause
goto menu

:exit
echo Goodbye!
pause
