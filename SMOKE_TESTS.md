# Smoke Test Commands

Quick reference for testing the deployed application.

## GitHub Actions - Manual Smoke Workflow

### Basic Test
```bash
gh workflow run "Manual Smoke" -f base_url="https://your-app.vercel.app"
```

### With Vercel Protection Bypass
```bash
gh workflow run "Manual Smoke" -f base_url="https://your-app.vercel.app" -f with_bypass=true
```

### Check Status
```bash
# List recent runs
gh run list --workflow "Manual Smoke" --limit 5

# Watch a specific run
gh run watch <run_id>
```

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
```
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
