'use client';

import { useEffect, useMemo, useState } from 'react';

type PostResult =
  | { ok: true; postedTo: string }
  | { ok: false; error: string };

export default function DigestPage() {
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<PostResult | null>(null);

  // Load latest digest from API
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/digest/last', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setText(data.text ?? '');
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const canPost = useMemo(() => text.trim().length > 0, [text]);

  const postToSlack = async () => {
    setPosting(true);
    setResult(null);
    try {
      const res = await fetch('/api/digest/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setResult({ ok: true, postedTo: data.channel || 'Slack webhook' });
    } catch (e: any) {
      setResult({ ok: false, error: e.message || 'Unknown error' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Daily Digest</h1>

      <div className="space-y-2">
        <label className="text-sm text-gray-500">Digest Markdown</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[280px] rounded-xl border p-3 font-mono text-sm"
          placeholder={loading ? 'Loading latest digest…' : 'Write or paste your digest here…'}
        />
      </div>

      <div className="flex gap-3">
        <button
          disabled={!canPost || posting}
          onClick={postToSlack}
          className="rounded-lg px-4 py-2 border hover:bg-gray-50 disabled:opacity-50"
        >
          {posting ? 'Posting…' : 'Post to Slack'}
        </button>

        <a
          href="/api/digest/last"
          className="rounded-lg px-4 py-2 border hover:bg-gray-50"
          target="_blank"
          rel="noreferrer"
        >
          View JSON
        </a>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-3 ${
            result.ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}
        >
          {result.ok ? (
            <p>✅ Posted to {result.postedTo}</p>
          ) : (
            <p>❌ Post failed: {result.error}</p>
          )}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Preview</h2>
        <pre className="whitespace-pre-wrap rounded-xl border p-3 bg-white">{text}</pre>
      </section>
    </div>
  );
}
