@echo off
echo Restarting Justice Dashboard Server...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
start /b node server.js
echo Server restarted!
pause
