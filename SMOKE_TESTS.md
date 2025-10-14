# Smoke Test Commands

## Quick Start (PowerShell-safe)

```powershell
# 0) Set your deploy URL
$BASE = "https://your-app.vercel.app"  # replace with your real URL

# 1) Trigger the Manual Smoke (toggle with_bypass as needed)
gh workflow run "Manual Smoke" -f base_url="$BASE" -f with_bypass=true

# 2) Grab newest run id and watch to completion (fails shell on non-success)
$RUN_ID = gh run list --workflow "Manual Smoke" --limit 1 --json databaseId -q ".[0].databaseId"
gh run watch $RUN_ID --exit-status

# 3) Inspect logs and artifacts
gh run view $RUN_ID
gh run view $RUN_ID --log
gh run download $RUN_ID -D ".\artifacts\smoke-$RUN_ID"

# 4) Optional: direct SSE probe
$body = @{ text = "hello world"; dryRun = 1 } | ConvertTo-Json -Compress
curl.exe -N -H "Accept: text/event-stream" -H "Content-Type: application/json" `
  -X POST "$BASE/api/summarize/stream" --data $body
```

Notes:

- In PowerShell, angle brackets like `<run_id>` are treated as redirection. Use `$RUN_ID` instead.
- `--workflow "Manual Smoke"` (by name) vs `--workflow "smoke.yml"` (by file): either works if it matches your repo.
- Common issues: quoting URLs that include `?` or `&`; attempting bypass without secrets set (workflow prints bypass status without revealing secrets).


Quick reference for testing the deployed application.

## GitHub Actions - Manual Smoke Workflow

### Basic Test (PowerShell-safe)
 
```powershell
$BASE="https://your-app.vercel.app"  # replace with your real deploy URL
gh workflow run "Manual Smoke" -f base_url="$BASE"
```

### With Vercel Protection Bypass
 
```powershell
# Requires Actions secret VERCEL_BYPASS_TOKEN or VERCEL_SSO_BYPASS
$BASE="https://your-app.vercel.app"
gh workflow run "Manual Smoke" -f base_url="$BASE" -f with_bypass=true
```

### Check Status (PowerShell-safe)
 
```powershell
# List recent runs for this workflow
gh run list --workflow "Manual Smoke" --limit 5

# Capture the newest run ID and watch it
$RUN_ID = gh run list --workflow "Manual Smoke" --limit 1 --json databaseId -q ".[0].databaseId"
gh run watch $RUN_ID --exit-status
```
Note: Avoid using angle brackets like `<run_id>` in PowerShell; they are treated as redirection.

---

## Direct API Testing

### SSE Endpoint (bash/Linux/macOS)
 
```bash
curl -N -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -X POST https://your-app.vercel.app/api/summarize/stream \
  --data '{"text":"hello world"}'
```

### SSE Endpoint (PowerShell/Windows)
 
```powershell
$body = @{ text = "hello world" } | ConvertTo-Json -Compress
curl.exe -N -H "Accept: text/event-stream" `
  -H "Content-Type: application/json" `
  -X POST https://your-app.vercel.app/api/summarize/stream `
  --data $body
```

### Expected Response
You should see Server-Sent Events like:
 
```text
event: stage
data: {"name":"init"}

event: progress
data: {"percent":10}

...

event: done
data: {}
```

---

## Acceptance Tests Against Deployed App

### bash/Linux/macOS
 
```bash
export BASE_URL="https://your-app.vercel.app"
pnpm test
```

### PowerShell/Windows
 
```powershell
$env:BASE_URL="https://your-app.vercel.app"
pnpm test
```

The acceptance tests in `tests-node/summarize.accept.test.mjs` will run against the live deployment when `BASE_URL` is set.

---

## Legacy Endpoint Verification

The `/api/summarize` endpoint should return 410 (Gone) and redirect to the SSE endpoint:

```bash
curl -i https://your-app.vercel.app/api/summarize
```

Expected response:
 
```json
HTTP/1.1 410 Gone
{
  "error": "MOVED_TO_SSE",
  "next": "/api/summarize/stream"
}
```

---

## Health Check

 
```bash
curl https://your-app.vercel.app/
```

Should return 200 OK with the Next.js application.

---

## Troubleshooting

### If smoke tests fail:
1. Check Vercel deployment status: `vercel ls --prod`
2. Check application logs: `vercel logs --prod`
3. Verify environment variables are set in Vercel dashboard
4. Test locally first: `pnpm run dev` then `curl http://localhost:3000/api/summarize/stream`

### Common issues:
- **401/403**: Check `VERCEL_BYPASS_TOKEN` if using protection
- **500**: Check server logs for errors
- **Timeout**: Increase timeout in smoke test configuration
- **Connection refused**: Deployment may not be fully ready, wait 30s and retry

---

## Extras

### Filter runs by branch
 
```powershell
gh run list --workflow "Manual Smoke" --branch main --limit 5
```

### Re-run the same run (keeps inputs)
 
```powershell
gh run rerun $RUN_ID
```
