// scripts/generate-docs-manifest.mjs
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const REPO_OWNER = "sspedowski";
const REPO_NAME  = "justice-document-pip";
const BRANCH     = process.env.GITHUB_REF_NAME || process.env.BRANCH || "main";

const SCAN_FOLDERS = ["input", "output", "app/data/uploads", "app/data/exports", "docs", "pdfs"];
const ALLOWED_EXTS = new Set([".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".txt"]);

const outPath = "public/docs-manifest.json";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...await walk(p));
    else results.push(p);
  }
  return results;
}

async function sha256(file) {
  const buf = await fs.readFile(file);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const all = [];
  for (const folder of SCAN_FOLDERS) {
    try { await fs.access(folder); } catch { continue; }
    const files = (await walk(folder)).filter(f => ALLOWED_EXTS.has(path.extname(f).toLowerCase()));
    for (const file of files) {
      const stat = await fs.stat(file);
      const rel  = file.replace(/\\/g, "/");
      const raw  = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${rel}`;
      const web  = `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${BRANCH}/${rel}`;
      all.push({ path: rel, size: stat.size, sha256: await sha256(file), raw_url: raw, web_url: web, ext: path.extname(file).toLowerCase(), updated: stat.mtime.toISOString() });
    }
  }
  await fs.mkdir("public", { recursive: true });
  await fs.writeFile(outPath, JSON.stringify({ branch: BRANCH, count: all.length, files: all }, null, 2));
  console.log(`Wrote ${outPath} with ${all.length} file(s).`);
}
main().catch(err => { console.error(err); process.exit(1); });
