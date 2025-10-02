# Production Setup Guide

This guide covers production-ready enhancements added to the Justice Dashboard Claude integration.

## Features Included

1. **Rate Limiting** - Protects `/api/summarize/stream` endpoint (20 req/min/IP)
2. **Request Tracking** - `requestId` and `elapsedMs` in responses
3. **CI Smoke Tests** - Automated SSE endpoint verification

---

## 1. Rate Limiting

### Development (In-Memory)

The default configuration uses an in-memory rate limiter suitable for dev and single-instance deployments.

**No setup required** - works out of the box with:
- Limit: 20 requests per minute per IP
- Window: Sliding 1-minute window
- Applies to: `/api/summarize/stream`

### Production (Upstash Redis)

For multi-instance production deployments, upgrade to Upstash:

**1. Install dependencies:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**2. Set environment variables:**
```bash
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**3. Update `middleware.ts`:**

Uncomment the Upstash section and comment out the MemoryRateLimiter:

```typescript
// Production: Upstash Redis (multi-instance)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'rl:summarize',
});

// Dev: In-memory (comment out for production)
// const ratelimit = new MemoryRateLimiter({ ... });
```

**Get Upstash credentials:**
1. Sign up at [console.upstash.com](https://console.upstash.com/)
2. Create a Redis database
3. Copy REST URL and token from dashboard

---

## 2. Request Tracking

All responses now include:

**`requestId`** - UUID for request tracing
**`elapsedMs`** - Total processing time in milliseconds

### SSE Stream Response
```
event: end
data: {"stage":"done","ok":true,"summary":"...","requestId":"123e4567-...","elapsedMs":1234}
```

**Usage in logs:**
```typescript
console.log(`[${requestId}] Summarization completed in ${elapsedMs}ms`);
```

---

## 3. CI Smoke Tests

Automated smoke tests run after successful deployments.

### Workflow: `.github/workflows/smoke-test.yml`

Triggers on `deployment_status` success and verifies:
- ✅ SSE endpoint returns valid `text/event-stream`
- ✅ Response includes `start` or `done` stage
- ✅ No fatal errors in response

### Manual Smoke Test

```bash
curl -i -N -X POST \
  -H 'Accept: text/event-stream' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Production smoke test"}' \
  https://your-domain.com/api/summarize/stream
```

**Expected output:**
```
HTTP/2 200
content-type: text/event-stream; charset=utf-8
...

: connected 1234567890

data: {"stage":"start"}

data: {"stage":"provider","name":"claude"}

data: {"stage":"done","ok":true,"summary":"...","requestId":"...","elapsedMs":1234}

event: end
data: {"stage":"done",...}
```

---

## Environment Variables Summary

```bash
# Claude AI
CLAUDE_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-haiku-20240307  # optional
CLAUDE_MAX_TOKENS=800                 # optional

# Rate Limiting (Production)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Deployment Checklist

### Pre-Deploy
- [ ] Set `CLAUDE_API_KEY` in environment
- [ ] (Optional) Set `UPSTASH_*` vars for multi-instance rate limiting
- [ ] Review rate limits (20 req/min/IP) and adjust if needed
- [ ] Test locally with `npm run dev`

### Post-Deploy
- [ ] Run manual smoke test (curl command above)
- [ ] Verify SSE endpoint returns valid frames
- [ ] Check logs for `requestId` and `elapsedMs`
- [ ] Confirm rate limiting works (try > 20 requests/min)
- [ ] Monitor CI smoke test results

### Monitoring
- [ ] Watch Claude API usage in Anthropic Console
- [ ] Set up billing alerts
- [ ] Monitor `elapsedMs` for performance trends
- [ ] Track rate limit 429 responses

---

## Cost Estimation

**Claude Haiku Pricing:**
- Input: $0.25 per million tokens (~750k words)
- Output: $1.25 per million tokens (~750k words)

**Example:**
- 500-word case note summary
- Input: ~700 tokens, Output: ~200 tokens
- Cost: ~$0.0004 per request

**Monthly estimate (1000 requests/day):**
- ~30,000 requests/month
- ~$12/month at current pricing

**Upstash (if used):**
- Free tier: 10,000 requests/day
- Pro: $0.20 per 100k requests

---

## Troubleshooting

### Rate limit not working
- Check middleware is loaded: `middleware.ts` must be at repo root
- Verify matcher pattern includes your route
- For Upstash: check env vars are set correctly

### Request tracking missing
- Ensure you're on latest code (requestId added to stream route)
- Check final SSE frame has `event: end` with data

### Smoke test failing
- Verify deployment URL is correct
- Check CORS/firewall allows curl from CI
- Review deployment logs for errors

### Typed client errors
- "Non-JSON response": Check you're hitting `/json` not `/stream`
- "Unexpected shape": Response format changed, update type guard
- "Invalid JSON": Server error, check logs with `requestId`

---

## Next Steps

1. **Add length validation** - Reject requests > 20k chars
2. **Add analytics** - Track usage by user/feature
3. **Add caching** - Cache frequent summaries (Redis/KV)
4. **Add streaming client** - TypeScript wrapper for SSE endpoint
5. **Add retry logic** - Exponential backoff in client

---

## Support

- **Documentation**: [docs/ai-usage-claude.md](docs/ai-usage-claude.md)
- **Claude API**: [docs.anthropic.com](https://docs.anthropic.com/)
- **Upstash**: [docs.upstash.com](https://docs.upstash.com/)
- **Issues**: GitHub repository issues

---

**Last Updated:** 2025-10-02
**Version:** 1.0.0 (Production enhancements)
