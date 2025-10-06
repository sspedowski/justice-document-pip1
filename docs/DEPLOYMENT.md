# Vercel Deployment: Next.js App in Subfolder

Your Next.js app lives in `justice-dashboard-next/`.

You have two supported deployment patterns:

## Option A (Recommended): Keep Subfolder + Set Root Directory

1. In Vercel: Project → Settings → General → Root Directory = `justice-dashboard-next/`
2. Redeploy and check “Clear build cache”.
3. Expected build log:
   - `Detected Next.js version: 14.x`
   - `Running "next build"`
4. Environment variables: define in Vercel settings (do not commit secrets).

## Option B: Move App to Repository Root

Run the PowerShell script in `scripts/move-next-to-root.ps1` (adds branch `chore/move-next-to-root`).
After merge, set Root Directory back to `/` (or remove custom setting) and redeploy.

## Why Remove Root `vercel.json`?

Having both a root `vercel.json` and a Root Directory override can cause framework detection confusion. We removed the root file so Vercel uses the subfolder setting cleanly.

## Minimal Requirements Inside `justice-dashboard-next/`

- `package.json` with `next`, `react`, `react-dom` dependencies.
- `next.config.ts` (or `.js`) containing `{ output: 'standalone' }` for improved cold start performance.
- Node engine `>=18` (already set).

## Local Build Check

```bash
cd justice-dashboard-next
npm ci
npm run build
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Vercel logs: no Next.js detected | Root Directory not set | Set Root Directory to subfolder or move app to root |
| Build fails on missing dependency | Outdated lockfile | `npm ci` locally then commit updated lockfile |
| Env-based errors at runtime | Missing Vercel env vars | Add them in Project → Settings → Environment Variables |

## History / Notes

- Root `vercel.json` removed in branch `chore/vercel-config-cleanup`.
- Deployment docs added to prevent future misconfiguration.
