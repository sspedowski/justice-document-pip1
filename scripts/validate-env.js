const fs = require('fs');
const path = require('path');

console.log('🔍 Justice Dashboard Environment Validation\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', 'justice-server', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found in justice-server/');
  console.log(`📝 Please copy ${envExamplePath} to ${envPath} and configure it`);
  process.exit(1);
}

// Load environment variables
const dotenvPath = path.join(__dirname, '..', 'justice-server', 'node_modules', 'dotenv');
const dotenv = require(dotenvPath);
dotenv.config({ path: envPath });

const checks = [
  { name: 'JWT_SECRET', required: true, minLength: 32 },
  { name: 'SESSION_SECRET', required: true, minLength: 32 },
  { name: 'OPENAI_API_KEY', required: false },
  { name: 'PORT', required: false, default: '3000' },
  { name: 'NODE_ENV', required: false, default: 'development' }
];

let allValid = true;

checks.forEach(check => {
  const value = process.env[check.name];
  
  if (!value && check.required) {
    console.log(`❌ ${check.name}: Missing (required)`);
    allValid = false;
  } else if (!value && !check.required) {
    console.log(`⚠️  ${check.name}: Not set (optional, using default: ${check.default || 'none'})`);
  } else if (check.minLength && value.length < check.minLength) {
    console.log(`❌ ${check.name}: Too short (minimum ${check.minLength} characters)`);
    allValid = false;
  } else {
    console.log(`✅ ${check.name}: Valid`);
  }
});

console.log('\n' + (allValid ? '✅ Environment validation passed!' : '❌ Environment validation failed!'));

if (!allValid) {
  console.log('📝 Please check your .env file and fix the issues above.');
  process.exit(1);
}
