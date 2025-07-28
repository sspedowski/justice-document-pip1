#!/bin/bash
echo "🚀 Setting up Justice Dashboard..."

# Install main dependencies
echo "📦 Installing main dependencies..."
npm install

# Install justice-server dependencies
echo "📦 Installing justice-server dependencies..."
cd justice-server
npm install
cd ..

# Install justice-dashboard (frontend) dependencies if package.json exists
if [ -d "justice-dashboard" ] && [ -f "justice-dashboard/package.json" ]; then
  echo "📦 Installing justice-dashboard (frontend) dependencies..."
  cd justice-dashboard
  npm install
  cd ..
fi

echo "✅ Setup complete! You can now run:"
echo "   npm start    # Start the backend server"
echo "   npm run dev  # Start the frontend dev server"
