# Justice Dashboard

## Streaming summarize API

Endpoint: `POST /api/summarize/stream`
Legacy pointer: `/api/summarize` returns 410 JSON `{ error: 'MOVED_TO_SSE', next: '/api/summarize/stream' }`.

Body (JSON):

```jsonc
{ "text": "string <= 4000 chars" }
```

Response: `text/event-stream` frames

```jsonc
{ "stage": "queued" }
{ "stage": "fetching", "progress": 10 }
{ "stage": "chunking", "progress": 35 }
{ "stage": "summarizing", "progress": 70 }
{ "stage": "result", "result": "Summary (...)" }
{ "stage": "end", "ok": true }
```

Test locally:

```bash
curl -N -X POST http://localhost:3000/api/summarize/stream \
  -H 'content-type: application/json' \
  -d '{"text":"Hello streaming world"}'
```

**Windows note:** Use `curl.exe` (not the PowerShell alias) so `-H` works correctly:

```powershell
curl.exe -N -X POST http://localhost:3000/api/summarize/stream -H 'content-type: application/json' -d '{\"text\":\"Hello streaming world\"}'
```

**Demo page:** Visit [http://localhost:3000/summarize-demo](http://localhost:3000/summarize-demo) for an interactive SSE demo with progress UI and cancel.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

![vercel-min health](https://github.com/sspedowski/justice-document-pip1/actions/workflows/health-check.yml/badge.svg)

## Hardening Gate (CI)

If a PR is labeled hardening, CI will:

1) Post a progress comment showing the Hardening TODO checklist status.
2) Block leaving Draft unless all items under the section heading `## Hardening TODO` in the PR description are checked.

Keep the checklist in the PR description (not comments) so automation can read it.

## Contributing: PR templates & hardening

We ship two PR templates:

- **Default PR template** – auto-applied to every PR.
- **Hardening PR** – selectable for security/performance changes. See the template: [.github/PULL_REQUEST_TEMPLATE/hardening.md](.github/PULL_REQUEST_TEMPLATE/hardening.md)

How to use the Hardening template: on the “Open a pull request” page, click Choose a template → Hardening PR.
Enforcement: when a PR has the hardening label and leaves Draft, CI enforces the checklist under `## Hardening TODO`. Use the security label as an additional signal for reviewers.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Streaming frames (framework-neutral)

The streaming summarize pipeline uses a framework-neutral async generator in `lib/summarize/frames.mjs`.

**Why:** decouples frame production from the web layer (Next.js / Express / etc.), simplifies isolated Node core tests, and keeps the API route focused on HTTP streaming concerns.

**Usage**

```js
// lib/summarize/frames.mjs
// export async function* summarizeFrames({ text, delayMs }) { ... }

import { summarizeFrames } from "@/lib/summarize/frames.mjs";

for await (const frame of summarizeFrames({ text: "hello", delayMs: 0 })) {
  // frame: { stage: 'queued' | 'fetching' | 'chunking' | 'summarizing' | 'result' | 'end', ... }
  // Example (inside route): controller.enqueue(encoder.encode(frameToSSE(frame)));
}
```

**Testing**

- Core behavior (order + termination) covered by Node core test runner:
  - `node --test tests-node/summarize.stream.test.mjs`
- Project script (globs `tests-node/**/*.mjs`):
  - `npm run test:unit-node`

The API route dynamically imports the module so tests never pull in Next.js internals.

### AI Integration (Claude)

The Justice Dashboard supports optional AI-powered summarization using Anthropic's Claude API.

**Quick setup:**

1. Add `CLAUDE_API_KEY` to your `.env.local` (see `.env.example`)
2. The summarize stream will automatically use Claude when the key is present
3. Without a key, falls back to mock responses for testing

**Documentation:** See [docs/ai-usage-claude.md](docs/ai-usage-claude.md) for detailed configuration, privacy considerations, prompt engineering, and troubleshooting.

### Security & Secrets

- Startup validation runs before `build` and `start`:
  - In **production/staging/preview**, the app **fails fast** if:
    - `JWT_SECRET` or `SESSION_SECRET` are missing/weak (≥32 chars required)
    - Default admin creds are used (`ADMIN_USERNAME=admin/root` or weak `ADMIN_PASSWORD`)
  - In **development**, placeholders are allowed (with warnings).

- CI runs **Gitleaks** to catch accidental secrets in commits.

Local commands:

```bash
npm run test:security           # unit test for secrets validator
npm run secret-scan:local       # gitleaks local scan (redacted)
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
