@echo off
cd /d %~dp0
echo Starting Justice Dashboard server...
start http://localhost:3000
node -r dotenv/config justice-server\server.js
pause