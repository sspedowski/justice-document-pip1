import React, { useEffect, useRef, useState } from "react";
import { Cloud, Upload } from "lucide-react";

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
  const timersRef = useRef({ intervals: [], timeouts: [] });
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    // attempt to initialize legacy module if present
    if (typeof window.JusticeDashboard !== "undefined") {
      try {
        window.JusticeDashboard.DOMElements.init?.();
        window.JusticeDashboard.EventHandlers.init?.();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Legacy init failed:", e);
      }
    }

    return () => {
      // cleanup timers
      timersRef.current.intervals.forEach(clearInterval);
      timersRef.current.timeouts.forEach(clearTimeout);
    };
  }, []);

  function onSelectFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // append to queue
    setQueue((q) => [...q, ...files.map((f) => ({ name: f.name, size: f.size }))]);
  }

  function startFakeUpload() {
    if (!queue.length) return;
    const t = setInterval(() => {
      setQueue((q) => q.slice(1));
    }, 1200);
    timersRef.current.intervals.push(t);
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
