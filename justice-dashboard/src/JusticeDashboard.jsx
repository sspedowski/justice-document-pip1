/* eslint-env browser */
import React from 'react';
import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setQueue((q) => [
      ...q,
      ...files.map((f) => ({ name: f.name, size: f.size })),
    ]);
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
    while (true) {
      const next = queue[0];
      if (!next) break;
      const duration = 1200 + Math.random() * 800;
      await animateProgress(duration, () => {});
      setQueue((q) => q.slice(1));
      await new Promise((r) => globalThis.setTimeout(r, 150));
    }
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
            multiple
            onChange={onSelectFiles}
          />
          <button type="button" onClick={startFakeUpload} className="px-3 py-2 border rounded">
            Start
          </button>
        </div>

        <div className="mt-4">
          <h3 className="font-medium mb-2">Upload Queue</h3>
          <ul>
            {queue.map((item, i) => (
              <li key={`${item.name}-${i}`} className="py-1">
                {item.name} - {item.size} bytes
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
