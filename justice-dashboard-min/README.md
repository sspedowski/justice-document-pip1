# Justice Dashboard — Minimal Working App

This is a *tiny, working* Next.js app with:

- ✅ `/api/health` health check (GET)
- ✅ `/api/upload` file upload (POST, multipart)
- ✅ Simple UI at `/` to test uploads (no backend storage; returns metadata)

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

### Health check
```bash
curl http://localhost:3000/api/health
```

### Upload via curl
```bash
curl -F "doc=@./example.pdf" -F "note=trial" http://localhost:3000/api/upload
```

## Deploy to Vercel

1) Push this folder to your repo (root recommended).
2) In Vercel, set **Root Directory** to this folder if needed.
3) Build command: `npm run build` (default is fine).

## Integrate into an existing project

- Copy the `app/api/health` and `app/api/upload` folders into your `app/api/`.
- Replace or merge `app/page.js` if you want the quick test UI.
- Ensure your `package.json` includes `next`, `react`, and `react-dom` versions compatible with Next 14.
- No storage is used — uploads are parsed and **discarded** after returning metadata (safest default for Vercel’s ephemeral filesystem).
