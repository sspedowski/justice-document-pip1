<!--
Justice Dashboard / Evidence System - LITE Pull Request Template
Use this ONLY when the change does not touch security-sensitive code or runtime behavior.
-->

# PR Title

## Summary (1-2 lines)

## Changes

- [ ] Code
- [ ] Config
- [ ] CI
- [ ] Docs
- [ ] Infra

---

## Lite Checklist (non-security)

Confirm all are true (or explain why any are N/A):

- [ ] No new/changed API endpoints (no `api/**`, `pages/api/**`, or `app/**/route.*`)
- [ ] No auth logic touched (no bearer/session code; no `lib/**auth**` updates)
- [ ] No App Check logic touched (no `lib/**appcheck**`, no middleware changes)
- [ ] No rate-limiter changes (no Upstash/KV/policies)
- [ ] No security headers/CORS/Next `headers()` changes
- [ ] No `vercel.json` routing keys added/changed
- [ ] No Firebase rules or database schema updates
- [ ] No new runtime dependencies that affect server code

If any item above is false -> **use the full template** instead.

---

## CI Prerequisites (must show proof)

- [ ] `npm ci` (or `pnpm i --frozen-lockfile`)
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] Unit tests green (link to CI or paste local output)

---

## Deploy Notes (only if applicable)

- [ ] N/A (no deploy-affecting changes)
      _or_
- [ ] Summary of any deploy considerations (static assets, docs, copy, etc.)

---

## Test Plan

**Automated:** (links)
**Manual:** steps + expected results

---

## Reviewer Checklist (maintainers)

- [ ] Change truly non-security
- [ ] CI proof present
- [ ] No secrets/PII in diffs/logs
