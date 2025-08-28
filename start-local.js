const { spawn } = require('child_process');

console.log('Starting Justice Dashboard locally...');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const server = spawn('node', ['server.js'], {
  cwd: './justice-server',
  stdio: 'inherit',
});
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: './justice-dashboard',
  stdio: 'inherit',
});

process.on('SIGINT', () => {
  console.log('\nStopping...');
  server.kill();
  client.kill();
});

