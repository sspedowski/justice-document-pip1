import { Cloud, Upload } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// Full React dashboard (converted from Claude component)

const STAT_COLORS = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
};

function StatCard({ title, value, color = "blue" }) {
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
  // Track requestAnimationFrame IDs for cleanup on unmount
  const timersRef = useRef({ rafIds: new Set() });
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    // attempt to initialize legacy module if present
    if (typeof window.JusticeDashboard !== "undefined") {
      try {
        window.JusticeDashboard.DOMElements.init?.();
        window.JusticeDashboard.EventHandlers.init?.();
      } catch (e) {
         
        console.warn("Legacy init failed:", e);
      }
    }

    return () => {
      // cleanup RAF ids
      if (timersRef.current?.rafIds) {
        timersRef.current.rafIds.forEach((id) => cancelAnimationFrame(id));
        timersRef.current.rafIds.clear();
      }
    };
  }, []);

  function onSelectFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // append to queue
    setQueue((q) => [...q, ...files.map((f) => ({ name: f.name, size: f.size }))]);
  }

  // Smooth progress animation using requestAnimationFrame.
  // durationMs: animation time in ms; onStep receives pct 0..100
  function animateProgress(durationMs, onStep) {
    return new Promise((resolve) => {
      const start = performance.now();
      const tick = (now) => {
        const elapsed = Math.max(0, now - start);
        const pct = Math.min(100, (elapsed / durationMs) * 100);
        // Safely call onStep with error handling
        if (typeof onStep === 'function') {
          try { 
            onStep(pct); 
          } catch (e) {
            console.warn('Animation step error:', e);
          }
        }
        if (pct < 100) {
          const id = requestAnimationFrame(tick);
          timersRef.current.rafIds.add(id);
        } else {
          resolve();
        }
      };
      const id = requestAnimationFrame(tick);
      timersRef.current.rafIds.add(id);
    });
  }

  async function startFakeUpload() {
    // process queue sequentially with smooth animations
    while (true) {
      const next = queue[0];
      if (!next) break;
      const duration = 1200 + Math.random() * 800; // 1.2s - 2.0s
      await animateProgress(duration, () => {});
      // remove first item
      setQueue((q) => q.slice(1));
      // small pause between files
       
      await new Promise((r) => setTimeout(r, 150));
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
          <input ref={fileInputRef} id="file-upload" type="file" className="hidden" multiple onChange={onSelectFiles} />
          <button type="button" onClick={startFakeUpload} className="px-3 py-2 border rounded">Start</button>
        </div>

        <div className="mt-4">
          <h3 className="font-medium mb-2">Upload Queue</h3>
          <ul>
            {queue.map((item, i) => (
              <li key={`${item.name}-${i}`} className="py-1">{item.name} — {item.size} bytes</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
