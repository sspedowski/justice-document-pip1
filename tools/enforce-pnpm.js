#!/usr/bin/env node
// Abort installs that use npm or yarn; require pnpm for consistency.
const agent = process.env.npm_config_user_agent || '';
const isNpm = agent.startsWith('npm/');
const isYarn = agent.startsWith('yarn/');
if (isNpm || isYarn) {
  console.error('\nThis repo uses pnpm. Please install dependencies with:\n\n  pnpm install\n');
  console.error(`Detected package manager: ${agent}`);
  process.exit(1);
}
