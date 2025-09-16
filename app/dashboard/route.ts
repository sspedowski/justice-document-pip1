export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function GET() {
  const file = path.join(process.cwd(), 'public', 'dashboard', 'index.html');
  try {
    const html = await fs.readFile(file, 'utf8');
    return new NextResponse(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    // Fallback HTML when the dashboard bundle hasn't been built/copied yet.
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Justice Dashboard</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 2rem; line-height: 1.5; }
      code { background: #f3f4f6; padding: 0.15rem 0.35rem; border-radius: 0.25rem; }
      .box { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; }
    </style>
  </head>
  <body>
    <h1>Justice Dashboard</h1>
    <div class="box">
      <p>The dashboard bundle was not found at <code>/public/dashboard/index.html</code>.</p>
      <p>
        If you're running locally, build the Vite app and copy its output:
      </p>
      <ol>
        <li>In <code>justice-dashboard/</code>: run <code>npm run build</code></li>
        <li>Copy <code>justice-dashboard/dist</code> to <code>public/dashboard</code></li>
      </ol>
      <p>In CI or production, ensure the Vite build artifacts are published to <code>public/dashboard/</code>.</p>
    </div>
  </body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
}

