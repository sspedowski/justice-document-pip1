## Deployment (Vercel)

This document expands on the brief section in `README.md` and provides operational detail.

## Current Configuration Snapshot

| Aspect            | Status                                                  |
| ----------------- | ------------------------------------------------------- |
| `vercel.json`     | functions only (memory + maxDuration)                   |
| Routing keys      | none (no rewrites / redirects / routes / trailingSlash) |
| Legacy now.\*     | absent                                                  |
| `next.config.mjs` | security headers + Vite asset cache headers             |
| CSP               | commented (enable after audit)                          |

## Files

- `vercel.json`: restricts itself to specifying function resource limits.
- `next.config.mjs`: adds global security headers and immutable caching for built Vite dashboard assets under `/dashboard/assets/*`.

## Why keep it minimal?

Less surface area reduces accidental conflicts with Vercel's automatic Next.js integration (which already handles edge/server function outputs, static optimization, and routing layers).

## Re-Linking / Clearing Stale Project State

If you see warnings about mixed routing or missing project settings but the repo looks clean, your local `.vercel` folder may point at an old project or team.

### Windows (PowerShell)

```powershell
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
vercel logout
vercel login
vercel link
vercel
```

### macOS / Linux

```bash
rm -rf .vercel || true
vercel logout
vercel login
vercel link
vercel
```

## Safely Introducing Routing Rules

If later you need rewrites or redirects:

1. Add them to `vercel.json` under their dedicated keys.
2. Do NOT also add a top-level `routes` array (mutually exclusive with granular keys).
3. Keep changes small and deploy to a preview first.

Example (adding a single redirect):

```jsonc
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "redirects": [
    { "source": "/old-path", "destination": "/new-path", "permanent": true },
  ],
  "functions": { "api/**": { "memory": 512, "maxDuration": 30 } },
}
```

## Adjusting Function Resources

Increase memory or duration only when profiling data shows limits are hit.

```jsonc
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "app/**/route.ts": { "memory": 768, "maxDuration": 45 },
  },
}
```

## Content Security Policy (CSP)

A strict CSP is commented out to prevent breaking development and previews. Before enabling:

- Inventory all external origins (fonts, analytics, APIs, images).
- Decide whether to allow `'unsafe-inline'` or migrate to hashed inline scripts/styles.
- Add report-only first (via `Content-Security-Policy-Report-Only`) and observe logs.

Example hardened starting point (report-only):

```http
Content-Security-Policy-Report-Only: default-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; report-uri https://example.report-uri.com/r/d/csp/enforce
```

## When to Consider basePath

Only when _all_ pages move under a subdirectory (e.g. embedding the whole app beneath `/dashboard`). For a static Vite bundle living in `public/dashboard`, leave `basePath` unset.

## Troubleshooting Checklist

| Symptom                            | Action                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- |
| "Mixed routing properties" warning | Ensure no `routes` key if using `redirects/rewrites/headers`; remove legacy now.\* files; clear `.vercel` |
| Functions 404                      | Confirm file locations (App Router: `app/\*\*/route.(ts                                                   | js)`or legacy`pages/api/\*`) |
| Headers missing in production      | Ensure they are returned from `next.config.mjs` `headers()` and not shadowed by edge middleware           |
| CSP blocked assets                 | Temporarily switch to `Content-Security-Policy-Report-Only` to collect violations                         |

## Future Enhancements (Optional)

- Add environment-specific headers (e.g., only enable CSP in production).
- Introduce `images.domains` once remote images are required.
- Use Edge Middleware for auth gating selected paths.

---

Maintained: keep this file updated when deployment or routing primitives change.
