#!/usr/bin/env bash
set -e

echo "Starting project cleanup and restructuring..."

# 1. Remove *.lnk and backup scripts
echo "Removing Windows shortcuts and backup scripts..."
find . -maxdepth 1 -type f \( -name "*.lnk" -o -name "*backup*.sh" \) -delete

echo "Removed Windows shortcuts and backup scripts."

# 2. Create frontend and backend directories, move files
echo "Creating frontend and backend directories..."
mkdir -p frontend backend

# Move server files
echo "Moving server files to backend..."
if [ -d "server" ]; then
    mv server/* backend/ 2>/dev/null || true
    rmdir server 2>/dev/null || true
fi

# Move client files to frontend
echo "Moving client files to frontend..."
if [ -d "client" ]; then
    mv client/* frontend/ 2>/dev/null || true
    rmdir client 2>/dev/null || true
fi

# Move any existing public, src directories
if [ -d "public" ]; then
    mv public frontend/ 2>/dev/null || true
fi

if [ -d "src" ]; then
    mv src frontend/ 2>/dev/null || true
fi

# Move package.json files appropriately
if [ -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    cp package.json frontend/
fi

if [ -f "yarn.lock" ]; then
    mv yarn.lock frontend/ 2>/dev/null || true
fi

echo "Reorganized project into frontend/ and backend/."

# 3. Create basic directory structure for documentation
echo "Ensuring proper directory structure..."
mkdir -p docs
mkdir -p scripts
mkdir -p config

echo "Project restructuring complete!"
echo "Frontend files are now in: ./frontend/"
echo "Backend files are now in: ./backend/"
echo "Documentation is organized in existing folders and ./docs/"
