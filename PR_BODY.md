# feat(upload): prod-secure streaming upload with Auth+App Check, rate limit, Firestore log, signed URLs, optional PDF extraction

## Summary

Adds a production-secure `/api/upload` that streams files to Firebase Storage with a MIME allowlist, size caps, SHA-256 hashing, **prod-only** Firebase **Auth + App Check**, **Upstash** rate limiting, **Firestore** metadata logging, short-lived **signed URLs**, and optional **PDF → text** extraction. Removes temporary TS/ESLint build ignores.

## Key changes


* `lib/firebaseAdmin.ts`: strict Admin init, `bucket`, token verification helpers.
* `lib/rateLimiter.ts`: Upstash sliding window (20 uploads / 5m per user/IP).
* `lib/signedUrl.ts`: V4 read URLs (30m).
* `lib/pdf.ts`: optional `pdf-parse` extraction to `*.txt`.
* `app/api/upload/route.ts`: streaming upload handler with allowlist + caps, Auth+App Check (prod), RL, Firestore metadata, SHA-256, signed URLs, optional extraction.
* `app/api/health/route.ts`: standardized env checks.
* Build: removed temp `typescript`/`eslint` ignores.

## Environment variables (Vercel → Project → Settings → Environment Variables)

Required:


* `FIREBASE_SERVICE_ACCOUNT` (JSON)
* `FIREBASE_STORAGE_BUCKET` (exact bucket ID from Firebase Storage)
* `GOOGLE_API_KEY`

Recommended:

* `UPSTASH_REDIS_REST_URL`
* `UPSTASH_REDIS_REST_TOKEN`

Optional:

* `UPLOAD_MAX_BYTES` (default 10485760)
* `EXTRACT_PDF_TEXT` = `true` to enable PDF text extraction

## Security model


* Server-side only: secrets never exposed to client.
* In production, requests require valid Firebase ID token + App Check.
* Rate limiting per user/IP (sliding window).
* Firestore `uploads` stores metadata only; no raw file content.
* Signed URLs short-lived (30m default).
* Optional PDF extraction saved alongside file as `.txt`.

## API

`POST /api/upload` (multipart/form-data)

Files: up to 5 (`pdf`, `png`, `jpeg/jpg`, `webp`, `txt`)
Additional small fields allowed (e.g. `category`).

Success (200):

```json
{
  "ok": true,
  "service": "justice-dashboard",
  "ts": "ISO-8601",
  "count": 1,
  "files": [
    {
      "fieldname": "doc",
      "filename": "example.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "sha256": "<hex>",
      "storagePath": "uploads/YYYY-MM-DD/<uuid>.pdf",
      "signedUrl": "https://...",
      "textExtract": { "txtPath": "uploads/.../file.txt", "chars": 4567 }
    }
  ],
  "fields": { "category": "evidence" },
  "rate": { "remaining": 19, "reset": 1725900000 }
}
```

Errors (4xx/5xx): `{ "error": "<message>" }`


## Firestore

Collection: `uploads` (doc id = generated UUID). Server-only write. Owner read rules to follow.

## Test plan

Local (dev bypasses Auth/App Check):

```bash
npm ci
npm run dev
curl -F "doc=@./pdfs/example1.pdf" -F "category=evidence" http://localhost:3000/api/upload
```
Prod (requires tokens):

```bash
curl -F "doc=@./pdfs/example1.pdf" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "X-Firebase-AppCheck: <APP_CHECK_TOKEN>" \
  https://<your-domain>/api/upload
```

## Risks & mitigations

* Misconfigured env → 500: health route + CI catch early.
* MIME allowlist too narrow: adjust `ALLOW` set.
* RL tuning: edit window in `lib/rateLimiter.ts`.

## Follow-ups (separate PRs)

* Add `docId` to response.
* Delete endpoint with ownership checks.
* Integration tests (rate limit + extraction).
* Log viewer page.
* PDF text indexing/search.
