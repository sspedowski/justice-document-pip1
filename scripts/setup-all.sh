#!/bin/bash
# Justice Dashboard Automated Setup Script
# Run this from the root of your project (justice-dashboard/)

set -e

# 1. Backend Setup
if [ -d "justice-dashboard/backend" ]; then
  echo "\n[1/5] Installing backend dependencies..."
  cd justice-dashboard/backend
  npm install
  npm install bcrypt winston
  cd ../..
else
  echo "Backend folder not found!"
  exit 1
fi

# 2. .env Check (moved up, since it's needed for backend & frontend)
if [ -f "justice-dashboard/backend/.env" ]; then
  echo "\n[2/5] .env file found in backend."
else
  echo "\n[2/5] WARNING: .env file missing in backend!"
fi

# 3. User Management Setup
if [ -f "admin-users.js" ]; then
  echo "\n[3/5] Installing bcrypt for user management..."
  npm install bcrypt
  echo "\n[3/5] You can now run: node admin-users.js to add/reset users."
else
  echo "admin-users.js not found!"
fi

# 4. Frontend Setup
if [ -d "justice-dashboard/frontend" ]; then
  echo "\n[4/5] Installing frontend dependencies..."
  cd justice-dashboard/frontend
  npm install
  npm run build
  cd ../..
else
  echo "Frontend folder not found!"
  exit 1
fi

# 5. Start Backend
cd justice-dashboard/backend
if [ -f "server.js" ]; then
  echo "\n[5/5] Starting backend server..."
  node server.js
else
  echo "server.js not found in backend!"
  exit 1
fi

# Note: To start the frontend dev server, run:
# cd justice-dashboard/frontend && npm run dev
