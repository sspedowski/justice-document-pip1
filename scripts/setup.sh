#!/bin/bash
echo "🚀 Setting up Justice Dashboard..."

# Check if we're in CI environment
if [ "$CI" = "true" ]; then
  echo "🤖 CI environment detected"
else
  echo "🖥️  Local environment detected"
fi

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

# Create .env file if it doesn't exist (for local development)
if [ "$CI" != "true" ] && [ ! -f "justice-server/.env" ]; then
  echo "📝 Creating .env file from example..."
  if [ -f ".env.example" ]; then
    cp .env.example justice-server/.env
    echo "⚠️  Please edit justice-server/.env with your actual values"
  else
    echo "❌ .env.example not found. Please create justice-server/.env manually."
  fi
fi

echo "✅ Setup complete!"

if [ "$CI" = "true" ]; then
  echo "🤖 CI setup finished - environment variables provided via CI"
else
  echo "🖥️  Local setup finished. You can now run:"
  echo "   npm start    # Start the backend server"
  echo "   npm run dev  # Start the frontend dev server"
fi
