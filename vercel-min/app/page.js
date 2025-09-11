    'use client';
    import { useState } from 'react';

    export default function Home() {
      const [result, setResult] = useState(null);
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);

      const onSubmit = async (ev) => {
        ev.preventDefault();
        setBusy(true);
        setError(null);
        setResult(null);
        try {
          const form = new FormData(ev.currentTarget);
          const res = await fetch('/api/upload', { method: 'POST', body: form });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error || 'Upload failed');
          setResult(json);
        } catch (e) {
          setError(String(e?.message || e));
        } finally {
          setBusy(false);
        }
      };

      return (
        <div>
          <h1 style={{ marginTop: 0, fontSize: 28 }}>⚖️ Justice Dashboard — Minimal Working App</h1>
          <p style={{ opacity: 0.9 }}>
            Use this quick form to verify uploads are parsed and a response is returned. Files are not stored.
          </p>
          <form onSubmit={onSubmit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            <label>
              <div>Note (optional)</div>
              <input name="note" placeholder="trial" style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #2a3360', background: '#0b1020', color: '#e8f0fe' }} />
            </label>
            <label>
              <div>Files</div>
              <input name="doc" type="file" multiple style={{ width: '100%' }} />
            </label>
            <button
              type="submit"
              disabled={busy}
              style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #2a3360', background: busy ? '#2a3360' : '#1b2450', color: '#e8f0fe', cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              {busy ? 'Uploading…' : 'Upload'}
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            <a href="/api/health" style={{ color: '#81a7ff', textDecoration: 'none' }}>Check /api/health</a>
          </div>

          {error && (
            <pre style={{ marginTop: 16, padding: 12, background: '#0b0f22', borderRadius: 10, overflow: 'auto' }}>
              {error}
            </pre>
          )}

          {result && (
            <pre style={{ marginTop: 16, padding: 12, background: '#0b0f22', borderRadius: 10, overflow: 'auto' }}>
{JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      );
    }
