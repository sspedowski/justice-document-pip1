/* eslint-env browser */
import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { authFetch } from './lib/auth-fetch.js';

const STAT_COLORS = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

function StatCard({ title, value, color = 'blue' }) {
  const classes = STAT_COLORS[color] || STAT_COLORS.blue;
  return (
    <div className={`p-4 rounded-md shadow-sm ${classes.bg}`}>
      <div className={`text-xs font-medium ${classes.text}`}>{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function JusticeDashboard() {
  const fileInputRef = useRef(null);
  const timersRef = useRef({ rafIds: new Set() });
  const [queue, setQueue] = useState([]);
  const [progressPct, setProgressPct] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [results, setResults] = useState([]);
  const API_BASE = (function () {
    try {
      // Prefer Vite env, then global override, then localhost fallback
      // Avoid using `typeof import` in JSX files since some parsers choke on it.
      let fromEnv = null;
      try {
        /* eslint-disable no-undef */
        if (typeof importMeta !== 'undefined' && importMeta && importMeta.env && importMeta.env.VITE_API_URL) {
          fromEnv = importMeta.env.VITE_API_URL;
        }
        /* eslint-enable no-undef */
      } catch {
        // importMeta may not be available in some bundlers; fall back silently
      }
      if (fromEnv) return fromEnv;
      if (globalThis.API_BASE_URL) return globalThis.API_BASE_URL;
      const host = globalThis.location?.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
      return isLocal ? 'http://localhost:3000' : '';
    } catch {
      return '';
    }
  })();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.JusticeDashboard) {
      try {
        window.JusticeDashboard.DOMElements?.init?.();
        window.JusticeDashboard.EventHandlers?.init?.();
      } catch (e) {
        if (typeof console !== 'undefined') console.warn('Legacy init failed:', e);
      }
    }

    // Capture the current Set reference to avoid ref churn issues in cleanup
    const ids = timersRef.current?.rafIds;
    return () => {
      if (ids) {
        ids.forEach((id) => globalThis.cancelAnimationFrame?.(id));
        ids.clear();
      }
    };
  }, []);

  function onSelectFiles(e) {
    const files = Array.from(e.target?.files || []);
    if (!files.length) return;
    // Keep File objects in state so metadata (lastModified, type) is preserved
    setQueue((q) => [...q, ...files]);
    // Clear native input to allow selecting the same file again
    try { if (e.target) e.target.value = ""; }
    catch (err) { if (typeof console !== 'undefined') console.warn('Failed to reset file input', err); }
  }

  function animateProgress(durationMs, onStep) {
    return new Promise((resolve) => {
      const nowFn = () => (globalThis.performance?.now ? globalThis.performance.now() : Date.now());
      const start = nowFn();
      const tick = (now) => {
        const elapsed = Math.max(0, now - start);
        const pct = Math.min(100, (elapsed / durationMs) * 100);
        try {
          if (typeof onStep === 'function') onStep(pct);
        } catch (e) {
          if (typeof console !== 'undefined') console.warn('Animation step error:', e);
        }
        if (pct < 100) {
          const id = (globalThis.requestAnimationFrame || ((cb) => setTimeout(() => cb(nowFn()), 16)))(tick);
          timersRef.current.rafIds.add(id);
        } else {
          resolve();
        }
      };
      const id = (globalThis.requestAnimationFrame || ((cb) => setTimeout(() => cb(nowFn()), 16)))(tick);
      timersRef.current.rafIds.add(id);
    });
  }

  async function startFakeUpload() {
    // Work on a snapshot of the queue at click time to avoid stale closures
    let remaining = [...queue];
    while (remaining.length > 0) {
      const next = remaining[0];
      setCurrentFile(next);
      setProgressPct(0);
      const duration = 1000 + Math.random() * 800;

      // Prepare upload
  const form = new (globalThis.FormData)();
      form.append('file', next);
      const uploadPromise = authFetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        body: form,
      });

      // Animate while upload runs
      const res = await Promise.race([
        uploadPromise,
        (async () => { await animateProgress(duration, (pct) => setProgressPct(pct)); return null; })(),
      ]).catch(() => null);

      // If animation finished first, wait for upload
      const finalRes = res === null ? await uploadPromise.catch((e) => e) : res;

      try {
        if (finalRes && typeof finalRes.ok === 'boolean') {
          const data = await finalRes.json().catch(() => ({}));
          const fileURL = typeof data.fileURL === 'string'
            ? (data.fileURL.startsWith('http') ? data.fileURL : `${API_BASE}${data.fileURL}`)
            : '';
          setResults((r) => [
            { name: next.name, ok: finalRes.ok, summary: data.summary || '', fileURL, error: data.error || '' },
            ...r,
          ]);
        } else {
          setResults((r) => [
            { name: next.name, ok: false, summary: '', fileURL: '', error: 'Network error' },
            ...r,
          ]);
        }
      } catch (e) {
        setResults((r) => [
          { name: next.name, ok: false, summary: '', fileURL: '', error: (e && e.message) || 'Upload failed' },
          ...r,
        ]);
      }

      // Ensure progress bar completes
      await animateProgress(Math.max(200, 100), (pct) => setProgressPct(pct));

      remaining = remaining.slice(1);
      setQueue(remaining);
      await new Promise((r) => globalThis.setTimeout(r, 120));
    }
    setCurrentFile(null);
    setProgressPct(0);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Cases" value={125} color="blue" />
        <StatCard title="Active" value={12} color="yellow" />
        <StatCard title="Misconduct" value={3} color="green" />
        <StatCard title="Flagged" value={7} color="purple" />
      </div>

      <div className="p-4 bg-white rounded shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded"
          >
            <Upload size={16} /> Select Files
          </button>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            style={{ display: 'none' }}
            multiple
            onChange={onSelectFiles}
          />
          <button type="button" disabled={queue.length === 0} onClick={startFakeUpload} className="px-3 py-2 border rounded disabled:opacity-50">
            Start
          </button>
        </div>

        <div className="mt-4">
          {currentFile && (
            <div className="mb-3">
              <div className="text-sm mb-1">Processing: {currentFile.name}</div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-blue-600 rounded" style={{ width: `${Math.round(progressPct)}%`, transition: 'width 80ms linear' }} />
              </div>
            </div>
          )}
          <h3 className="font-medium mb-2">Upload Queue</h3>
          <ul>
            {queue.map((item, i) => (
              <li key={`${item.name}-${item.size}-${item.lastModified ?? i}`} className="py-1">
                {item.name} - {item.size} bytes
              </li>
            ))}
          </ul>

          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Results</h3>
              <ul className="space-y-2">
                {results.map((r, i) => (
                  <li key={`${r.name}-${i}`} className="p-3 border rounded bg-gray-50">
                    <div className="text-sm font-semibold">{r.name}</div>
                    {r.ok ? (
                      <>
                        <div className="text-sm text-gray-700">{r.summary || 'No summary provided'}</div>
                        {r.fileURL && (
                          <a className="text-blue-600 text-sm underline" href={r.fileURL} target="_blank" rel="noreferrer">View PDF</a>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-red-600">{r.error || 'Upload failed'}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
