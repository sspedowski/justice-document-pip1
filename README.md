# Justice Dashboard

## Streaming summarize API

Endpoint: `POST /api/summarize`

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
curl -N -X POST http://localhost:3000/api/summarize \
  -H 'content-type: application/json' \
  -d '{"text":"Hello streaming world"}'
```

**Windows note:** Use `curl.exe` (not the PowerShell alias) so `-H` works correctly:

```powershell
curl.exe -N -X POST http://localhost:3000/api/summarize -H 'content-type: application/json' -d '{\"text\":\"Hello streaming world\"}'
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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
