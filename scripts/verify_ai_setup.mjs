#!/usr/bin/env node
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const args = Object.fromEntries(process.argv.slice(2).map(p=>{const [k,...rest]=p.split('=');return [k.replace(/^--/,''), rest.join('=')||true];}));
const url = (args.url||'http://localhost:3000').replace(/\/$/,'');
const text = args.text || 'Summarize this compliance memo about evidence handling.';
const idToken = args['id-token'] || args.idToken || '';
const appCheck = args['app-check'] || args.appCheck || '';

function log(sym,msg){console.log(sym,msg);} 
function fail(msg){log('❌',msg); process.exitCode=1;}
function ok(msg){log('✅',msg);} 
function warn(msg){log('⚠️',msg);} 

function scanRepo(){
  try {
    const pattern = 'client_email|private_key_id';
    const cmd = process.platform==='win32'
      ? `powershell -NoLogo -NoProfile -Command "Get-ChildItem -Recurse -File | Select-String -Pattern '${pattern}' | Select Path,Line"`
      : `git ls-files -z | xargs -0 grep -nE "${pattern}" || true`;
    const out = execSync(cmd,{stdio:['ignore','pipe','pipe']}).toString();
    if(out.trim()) fail('Potential service account remnants detected. Review output above.');
    else ok('No service account remnants in tracked files.');
  } catch(e){ warn('Repo scan skipped.'); }
}

function validateEnv(){
  const gk = process.env.GOOGLE_API_KEY;
  if(gk && gk.length>20) ok('GOOGLE_API_KEY present'); else fail('Missing / short GOOGLE_API_KEY');
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if(!raw){ fail('Missing FIREBASE_SERVICE_ACCOUNT'); return; }
  try{ const json = JSON.parse(raw); if(json.client_email && json.private_key) ok('FIREBASE_SERVICE_ACCOUNT JSON shape OK'); else fail('FIREBASE_SERVICE_ACCOUNT missing expected keys'); }
  catch{ fail('FIREBASE_SERVICE_ACCOUNT invalid JSON'); }
}

async function smoke(){
  const payload = JSON.stringify({ text });
  const headers = { 'Content-Type':'application/json' };
  if(idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if(appCheck) headers['X-Firebase-AppCheck'] = appCheck;
  let res;
  try { res = await fetch(`${url}/api/ai/summarize`, {method:'POST', headers, body: payload}); }
  catch(e){ fail(`Request error: ${e.message}`); return; }
  if(!res.ok){ fail(`HTTP ${res.status}`); return; }
  try{ const json = await res.json(); if(json.outputText) ok(`Summarize endpoint alive (model=${json.model||'n/a'})`); else fail('No outputText in response'); }
  catch{ fail('Invalid JSON response'); }
}

(async()=>{
  console.log('== AI Setup Verification ==');
  scanRepo();
  console.log('\n-- Env --');
  validateEnv();
  console.log('\n-- Tests --');
  try{ execSync('npm run -s test',{stdio:'inherit'}); ok('Vitest executed'); } catch{ fail('Vitest failed'); }
  console.log('\n-- Smoke --');
  await smoke();
})();
