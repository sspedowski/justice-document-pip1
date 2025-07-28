@echo off
echo 🚀 Setting up Justice Dashboard...

echo 📦 Installing main dependencies...
call npm install

echo 📦 Installing justice-server dependencies...
cd justice-server
call npm install
cd ..

if exist "justice-dashboard\package.json" (
  echo 📦 Installing justice-dashboard frontend dependencies...
  cd justice-dashboard
  call npm install
  cd ..
)

echo ✅ Setup complete! You can now run:
echo    npm start    # Start the backend server
echo    npm run dev  # Start the frontend dev server
pause
