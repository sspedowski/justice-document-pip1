# Justice Docsite Fix Bundle

## What this adds
- `scripts/generate-docs-manifest.mjs` — scans folders (input/output/app/data/uploads/docs/pdfs) and writes `public/docs-manifest.json`.
- `public/restore.html` — a static page that lists documents and lets you download or zip selected files.
- `cleanup_template_tests.ps1` — optional script to remove Spark template test/demo files.

## How to apply
1) Unzip this into your repo root (you should see `scripts/` and `public/`).
2) Remove template test files (optional but recommended):
   ```powershell
   PowerShell -ExecutionPolicy Bypass -File .\cleanup_template_tests.ps1
   ```
3) Ensure `package.json` has scripts (add if missing):
   ```json
   { "scripts": {
       "gen:manifest": "node scripts/generate-docs-manifest.mjs",
       "prebuild": "npm run gen:manifest"
   }}
   ```
4) Put your actual documents in one of: `input/`, `output/`, `app/data/uploads`, `docs`, or `pdfs` (you can edit the list at the top of the manifest script).
5) Build + commit:
   ```bash
   npm install
   npm run gen:manifest
   npm run build
   git add -A
   git commit -m "Add restore page and docs manifest"
   git push
   ```
6) Open `https://<your-gh-username>.github.io/justice-document-pip/restore.html`
