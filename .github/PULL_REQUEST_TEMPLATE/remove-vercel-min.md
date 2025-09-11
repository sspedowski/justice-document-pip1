# Remove vercel-min (temporary minimal deploy) ✅

## Preconditions
- [ ] Main app exposes `/api/health`, `/api/version`, `/api/upload` with equivalent responses
- [ ] Vercel Root Directory points to main app (not `vercel-min/`)
- [ ] Live deployment verified at production URL

## In this PR
- [ ] Remove `vercel-min/` folder
- [ ] Remove `health-check.yml` triggers limited to `vercel-min/**` or retarget them to main app paths
- [ ] Keep/retarget `live-smoke-on-deploy.yml` to production env only
- [ ] Keep/retarget `nightly-smoke.yml` to production URL
- [ ] Update README badge(s) to point to the main health workflow
- [ ] Reference baseline tag `vercel-min-v1` in the PR body for rollback

## Post-merge checks
- [ ] Vercel deploy succeeds on main app
- [ ] Auto live-smoke passes
- [ ] Nightly smoke passes next run
