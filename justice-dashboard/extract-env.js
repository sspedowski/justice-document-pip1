const fs = require('fs');

console.log('Extracting environment variables from configuration files...');

// Target files that might contain hard-coded credentials
const targetFiles = [
  // Current project structure
  'frontend/firebase.js',
  'backend/server.js', 
  // Check for files that were moved to frontend/backend
  'frontend/script.js',
  'frontend/index.html',
  'backend/package.json',
  // Original locations (if they still exist)
  'client/firebase.js',
  'server/server.js',
  'client/script.js',
  // Check parent directory structure
  '../client/firebase.js',
  '../server/server.js', 
  '../client/script.js',
  // Also check main package.json and config files
  'package.json',
  'vite.config.js',
  'tailwind.config.js'
];

let envVars = new Map();

// Common patterns for environment variables
const patterns = [
  /(API_KEY|OPENAI_API_KEY|FIREBASE_API_KEY)\s*[:=]\s*['"]([^'"]+)['"]/g,
  /(DB_PASS|DATABASE_PASSWORD|DB_PASSWORD)\s*[:=]\s*['"]([^'"]+)['"]/g,
  /(AUTH_DOMAIN|PROJECT_ID|STORAGE_BUCKET|MESSAGING_SENDER_ID|APP_ID)\s*[:=]\s*['"]([^'"]+)['"]/g,
  /(DASH_USER|DASH_PASS)\s*[:=]\s*['"]([^'"]+)['"]/g,
];

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`File not found: ${file}`);
    return;
  }

  console.log(`Scanning ${file}...`);
  const content = fs.readFileSync(file, 'utf8');

  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      const value = match[2];

      // Add VITE_ prefix for frontend environment variables
      const envKey =
        file.includes('frontend') || file.includes('client')
          ? key.startsWith('VITE_')
            ? key
            : `VITE_${key}`
          : key;

      envVars.set(envKey, value);
      console.log(`Found: ${envKey}`);
    }
  });
});

// Build environment file content
let envContent = '# Justice Dashboard Environment Variables\n\n';
envContent += '# Dashboard Authentication\n';
if (envVars.has('DASH_USER'))
  envContent += `DASH_USER=${envVars.get('DASH_USER')}\n`;
if (envVars.has('DASH_PASS'))
  envContent += `DASH_PASS=${envVars.get('DASH_PASS')}\n`;

envContent += '\n# OpenAI API Configuration\n';
if (envVars.has('OPENAI_API_KEY'))
  envContent += `OPENAI_API_KEY=${envVars.get('OPENAI_API_KEY')}\n`;

envContent +=
  '\n# Firebase Configuration (VITE_ prefix for client-side access)\n';
if (envVars.has('VITE_FIREBASE_API_KEY'))
  envContent += `VITE_FIREBASE_API_KEY=${envVars.get('VITE_FIREBASE_API_KEY')}\n`;
if (envVars.has('VITE_AUTH_DOMAIN'))
  envContent += `VITE_FIREBASE_AUTH_DOMAIN=${envVars.get('VITE_AUTH_DOMAIN')}\n`;
if (envVars.has('VITE_PROJECT_ID'))
  envContent += `VITE_FIREBASE_PROJECT_ID=${envVars.get('VITE_PROJECT_ID')}\n`;
if (envVars.has('VITE_STORAGE_BUCKET'))
  envContent += `VITE_FIREBASE_STORAGE_BUCKET=${envVars.get('VITE_STORAGE_BUCKET')}\n`;
if (envVars.has('VITE_MESSAGING_SENDER_ID'))
  envContent += `VITE_FIREBASE_MESSAGING_SENDER_ID=${envVars.get('VITE_MESSAGING_SENDER_ID')}\n`;
if (envVars.has('VITE_APP_ID'))
  envContent += `VITE_FIREBASE_APP_ID=${envVars.get('VITE_APP_ID')}\n`;

envContent += '\n# API Configuration\n';
envContent += 'VITE_API_URL=http://localhost:4000\n';

// Create .env file
if (envVars.size > 0) {
  fs.writeFileSync('.env', envContent);
  console.log('.env file created with extracted variables.');
} else {
  console.log('No environment variables found. Creating basic .env file...');
  fs.writeFileSync('.env', envContent);
}

// Create .env.example file (with placeholder values)
const exampleContent = envContent.replace(/=.*/g, '=your_value_here');
fs.writeFileSync('.env.example', exampleContent);
console.log('.env.example created with placeholder values.');

// Add .env to .gitignore if it doesn't exist
const gitignorePath = '.gitignore';
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

if (!gitignoreContent.includes('.env')) {
  gitignoreContent += '\n# Environment variables\n.env\n';
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('Added .env to .gitignore');
}

console.log('Environment extraction complete!');
console.log(`Found ${envVars.size} environment variables.`);
