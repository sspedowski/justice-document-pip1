"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  ok?: boolean;
  status?: string;
  at?: string;
  time?: string;
};

export default function HealthStatus() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: HealthResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load status";
        if (!cancelled) setError(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p role="alert">Error: {error}</p>;
  }
  if (!data) {
    return <p>Loading status…</p>;
  }

  // Normalize fields to Status/Time for display
  const status = typeof data.status === "string" ? data.status : data.ok ? "ok" : "unknown";
  const time = data.time ?? data.at ?? new Date().toISOString();

  return (
    <div className="health-status">
      <h2 className="text-lg font-semibold">Health</h2>
      <p>
        Status: <strong>{status}</strong>
      </p>
      <p>Time: {time}</p>
    </div>
  );
}
