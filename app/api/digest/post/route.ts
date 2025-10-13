import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Missing text' }, { status: 400 });
    }

    const webhook = process.env.SLACK_WEBHOOK;
    if (!webhook) {
      return NextResponse.json(
        { ok: false, error: 'SLACK_WEBHOOK not set' },
        { status: 500 },
      );
    }

    // Basic Slack webhook payload (mrkdwn supports Markdown-like formatting)
    const payload = { text };

    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Do NOT log this response body in production; Slack webhooks can echo errors
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { ok: false, error: `Slack error HTTP ${res.status}: ${errText}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, channel: 'Slack webhook' });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to post digest' },
      { status: 500 },
    );
  }
}
