#!/usr/bin/env node

/**
 * Firebase Project Creation Helper
 * This script helps create a new Firebase project from the command line
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Project Setup Helper');
console.log('===============================\n');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.log('❌ Firebase CLI not found. Installing...');
  execSync('npm install -g firebase-tools', { stdio: 'inherit' });
}

console.log('\n📋 Next steps:');
console.log('1. Go to https://console.firebase.google.com');
console.log('2. Click "Create a project"');
console.log('3. Enter project name: "justice-dashboard"');
console.log('4. Enable Google Analytics (optional)');
console.log('5. Click "Create project"');
console.log('\n🔧 After creating the project:');
console.log('6. Go to "Firestore Database" and click "Create database"');
console.log('7. Choose "Start in test mode"');
console.log('8. Select your preferred location');
console.log('\n🔑 Get your Firebase config:');
console.log('9. Go to Project Settings (gear icon)');
console.log('10. Scroll to "Your apps" and click "Add app"');
console.log('11. Choose "Web" and register your app');
console.log('12. Copy the config values to your .env file');

console.log('\n⚠️  Important: After getting your Firebase config, update the .env file:');
console.log('   Replace the dummy values with your actual Firebase configuration');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log(`\n📄 Your .env file is located at: ${envPath}`);
} else {
  console.log('\n❌ .env file not found. Please ensure it exists in the project root.');
}

console.log('\n🚀 Once configured, you can run:');
console.log('   npm run dev  (to start the development server)');
console.log('   firebase init  (to initialize Firebase in this project)');
