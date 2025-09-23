# Deployment Guide

## Local workflow

1. Run the dashboard publish script to build and copy the embedded assets:
   - macOS/Linux: `bash scripts/publish-dashboard.sh ./dashboard ./justice-dashboard ./public/dashboard`
   - Windows: `powershell -ExecutionPolicy Bypass -File scripts/publish-dashboard.ps1 -VitePath ./dashboard -AltPath ./justice-dashboard -NextPublic ./public/dashboard`
     - or `npm run dash:publish:win`
2. Build Next.js: `npm run build`
3. Start the app: `npm start`

> **Note:** Do not edit files under `public/dashboard/` manually; regenerate them via the publish scripts.

## Continuous integration

The workflow at `.github/workflows/build-and-smoke.yml` publishes the dashboard before building Next.js:

```yaml
- run: npm ci
- run: bash scripts/publish-dashboard.sh ./dashboard ./justice-dashboard ./public/dashboard
- run: npm run build
```

Ensure any custom CI runs the publish script before invoking `npm run build` so `public/dashboard/` exists.
