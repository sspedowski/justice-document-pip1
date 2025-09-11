Title: chore: retire vercel-min (main hosts health/version/upload)

Context: Prepare to remove the temporary minimal deployment now that the main app exposes /api/health, /api/version, and /api/upload and CI has Production-only smoke checks.

Preconditions (before merge)
- [ ] Vercel Root Directory set to the main app (repo root / main app/)
- [ ] Env set in Vercel: APP_SERVICE_NAME=justice-dashboard-main, APP_NAME=justice-dashboard, optional APP_VERSION, fallback GIT_SHA
- [ ] One Production deploy completed and live-smoke (auto) green (schema + latency)

In this PR
- [ ] Delete vercel-min/ (temporary minimal app)
- [x] Keep live-smoke filtered to Production only
- [x] Help-demo check disabled in both smokes (avoids 404 after removal)
- [x] README: help-demo link removed
- [ ] Confirm no workflows still scoped to vercel-min/** paths

Post-merge checks
- [ ] Next Production deploy green; nightly-smoke passes
- [ ] (Optional) Tag main-baseline-after-vercel-min
- [ ] (Optional) Delete hotfix/vercel-min branch

