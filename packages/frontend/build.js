#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Justice Dashboard Build Script');

try {
  // Install root dependencies
  console.log('📦 Step 1: Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: process.cwd() });

  // Install backend dependencies
  console.log('📦 Step 2: Installing backend dependencies...');
  const backendPath = path.join(process.cwd(), 'justice-server');
  execSync('npm install', { stdio: 'inherit', cwd: backendPath });

  // Install frontend dependencies  
  console.log('📦 Step 3: Installing frontend dependencies...');
  const frontendPath = path.join(process.cwd(), 'justice-dashboard');
  execSync('npm install', { stdio: 'inherit', cwd: frontendPath });

  console.log('✅ All dependencies installed successfully!');
  
  // Verify express module
  const expressPath = path.join(backendPath, 'node_modules', 'express', 'package.json');
  const fs = require('fs');
  
  if (fs.existsSync(expressPath)) {
    console.log('✅ Express module verified in justice-server/node_modules/');
  } else {
    console.log('❌ Express module NOT found!');
    process.exit(1);
  }
  
  console.log('🎉 Build complete - ready to start server!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
