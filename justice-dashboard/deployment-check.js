#!/usr/bin/env node

/**
 * Deployment Readiness Check for Justice Dashboard
 * Verifies environment configuration and security settings
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Justice Dashboard Deployment Readiness Check\n');

let issues = [];
let warnings = [];

// Check environment variables
function checkEnvironmentVariables() {
  console.log('🔧 Checking environment configuration...');
  
  const requiredEnvVars = [
    'JWT_SECRET',
    'ADMIN_USER', 
    'ADMIN_PASS',
    'OPENAI_API_KEY',
    'VITE_FIREBASE_PROJECT_ID'
  ];
  
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    issues.push('❌ .env file is missing');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  for (const envVar of requiredEnvVars) {
    if (!envContent.includes(`${envVar}=`) || envContent.includes(`${envVar}=your_`)) {
      issues.push(`❌ ${envVar} not properly configured in .env`);
    } else {
      console.log(`  ✅ ${envVar} configured`);
    }
  }
  
  // Check for weak secrets
  if (envContent.includes('JWT_SECRET=your-super-secret') || 
      envContent.includes('ADMIN_PASS=justice2025')) {
    issues.push('❌ Weak or default passwords detected');
  }
}

// Check file structure
function checkFileStructure() {
  console.log('\n📁 Checking file structure...');
  
  const requiredFiles = [
    'backend/server.js',
    'frontend/index.html',
    'frontend/script.js',
    'package.json',
    '.env.example'
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(`  ✅ ${file}`);
    } else {
      issues.push(`❌ Missing required file: ${file}`);
    }
  }
}

// Check security configuration
function checkSecurity() {
  console.log('\n🔒 Checking security configuration...');
  
  // Check if users.json is in .gitignore
  const gitignorePath = path.join(__dirname, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (gitignoreContent.includes('users.json') && 
        gitignoreContent.includes('.env') &&
        gitignoreContent.includes('*.lnk')) {
      console.log('  ✅ .gitignore properly configured');
    } else {
      warnings.push('⚠️  .gitignore may be missing security exclusions');
    }
  } else {
    warnings.push('⚠️  .gitignore file not found');
  }
  
  // Check for hard-coded secrets in server files
  const serverPath = path.join(__dirname, 'backend/server.js');
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    if (serverContent.includes('your-super-secret') || 
        serverContent.includes('hardcoded-password')) {
      issues.push('❌ Hard-coded secrets found in server code');
    } else {
      console.log('  ✅ No hard-coded secrets detected');
    }
  }
}

// Check dependencies
function checkDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    
    const requiredDeps = ['express', 'cors', 'bcryptjs', 'firebase'];
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length > 0) {
      warnings.push(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
    } else {
      console.log('  ✅ All required dependencies present');
    }
    
    // Check for test script
    if (packageJson.scripts?.test) {
      console.log('  ✅ Test script configured');
    } else {
      warnings.push('⚠️  No test script found');
    }
    
  } catch (error) {
    issues.push('❌ Could not read package.json');
  }
}

// Check build configuration
function checkBuildConfig() {
  console.log('\n🏗️  Checking build configuration...');
  
  const buildFiles = [
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js'
  ];
  
  for (const file of buildFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(`  ✅ ${file}`);
    } else {
      warnings.push(`⚠️  Build config missing: ${file}`);
    }
  }
}

// Main execution
checkEnvironmentVariables();
checkFileStructure();
checkSecurity();
checkDependencies();
checkBuildConfig();

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 DEPLOYMENT READINESS SUMMARY\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('🎉 ALL CHECKS PASSED! Your application is ready for deployment.\n');
  console.log('Next steps:');
  console.log('1. Run: npm run build:prod');
  console.log('2. Test in production environment');
  console.log('3. Deploy using: npm run deploy:firebase (or your chosen platform)');
} else {
  if (issues.length > 0) {
    console.log('❌ CRITICAL ISSUES (must fix before deployment):');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (should address):');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }
  
  if (issues.length > 0) {
    console.log('🚫 NOT READY FOR DEPLOYMENT - Fix critical issues first.');
    process.exit(1);
  } else {
    console.log('⚡ READY FOR DEPLOYMENT (with warnings noted above).');
  }
}

console.log('\n' + '='.repeat(60));
