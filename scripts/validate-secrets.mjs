#!/usr/bin/env node
// Fails fast if production-ish env uses weak or placeholder secrets.
// Environments enforced: production, staging, preview
const isProdLike = /^(production|staging|preview)$/i.test(process.env.NODE_ENV || '');
const env = (k, d = '') => (process.env[k] ?? d).toString().trim();

const issues = [];

function ban(name, val, patterns = []) {
  if (!val) return null; // absence handled separately
  const lower = val.toLowerCase();
  for (const p of patterns) {
    if (p instanceof RegExp) {
      if (p.test(val)) return `"${name}" matches banned pattern ${p}`;
    } else if (lower.includes(String(p).toLowerCase())) {
      return `"${name}" uses banned/placeholder fragment: ${p}`;
    }
  }
  return null;
}

const JWT_SECRET = env('JWT_SECRET');
const SESSION_SECRET = env('SESSION_SECRET');
const ADMIN_USER = env('ADMIN_USERNAME', 'admin');
const ADMIN_PASS = env('ADMIN_PASSWORD', 'adminpass');

if (isProdLike) {
  // JWT_SECRET checks
  if (!JWT_SECRET || JWT_SECRET.length < 32) issues.push('JWT_SECRET must be set and ≥ 32 chars in production-like environments.');
  const jwtBan = ban('JWT_SECRET', JWT_SECRET, ['change-me', 'changeme', 'default', 'secret', 'dev', /^dev-.*-secret$/i]);
  if (jwtBan) issues.push(jwtBan);

  // SESSION_SECRET checks
  if (!SESSION_SECRET || SESSION_SECRET.length < 32) issues.push('SESSION_SECRET must be set and ≥ 32 chars in production-like environments.');
  const sessionBan = ban('SESSION_SECRET', SESSION_SECRET, ['change-me', 'changeme', 'default', 'secret', 'dev']);
  if (sessionBan) issues.push(sessionBan);

  // Admin username/password must not be defaults
  const userBan = ban('ADMIN_USERNAME', ADMIN_USER, ['admin', 'root', 'test']);
  if (userBan) issues.push(userBan);

  if (!ADMIN_PASS || ADMIN_PASS.length < 12) issues.push('ADMIN_PASSWORD must be ≥ 12 chars in production-like environments.');
  const passBan = ban('ADMIN_PASSWORD', ADMIN_PASS, ['adminpass', 'password', 'changeme', 'secret']);
  if (passBan) issues.push(passBan);
} else {
  // Soft warnings in dev.
  if (/change-me|changeme/i.test(JWT_SECRET)) {
    console.warn('[validate-secrets] Dev warning: using placeholder JWT_SECRET');
  }
  if (/change-me|changeme/i.test(SESSION_SECRET)) {
    console.warn('[validate-secrets] Dev warning: using placeholder SESSION_SECRET');
  }
}

if (issues.length) {
  console.error('\n❌ Secret validation failed:\n - ' + issues.join('\n - ') + '\n');
  process.exit(1);
}
console.log('[validate-secrets] OK');
