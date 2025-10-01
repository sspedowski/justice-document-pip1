'use client';

import { useState } from 'react';

type ProgressEvent = {
  stage: string;
  progress: number;
  result?: string;
};

export default function SummarizeDemoPage() {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [running, setRunning] = useState(false);

  async function startStream() {
    setEvents([]);
    setRunning(true);

    try {
      const response = await fetch('/api/summarize', { method: 'POST' });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            setEvents((prev) => [...prev, data]);
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">SSE Streaming Demo</h1>
        <p className="text-sm text-gray-600">
          Demonstrates Server-Sent Events for real-time progress updates.
        </p>
      </div>

      <button
        onClick={startStream}
        disabled={running}
        className="rounded-lg border bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {running ? 'Streaming...' : 'Start Streaming'}
      </button>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Progress Events</h2>
        <div className="min-h-[200px] space-y-2 rounded-lg border bg-gray-50 p-4">
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">No events yet. Click "Start Streaming" above.</p>
          ) : (
            events.map((event, i) => (
              <div key={i} className="rounded border bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{event.stage}</span>
                  <span className="text-gray-600">{(event.progress * 100).toFixed(0)}%</span>
                </div>
                {event.result && (
                  <div className="mt-2 rounded bg-green-50 p-2 text-xs text-green-800">
                    Result: {event.result}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
        <h3 className="mb-2 font-medium">How it works</h3>
        <ul className="space-y-1 text-gray-700">
          <li>• Sends POST to <code className="rounded bg-blue-100 px-1">/api/summarize</code></li>
          <li>• Server streams progress events via SSE (text/event-stream)</li>
          <li>• Client displays each event as it arrives</li>
          <li>• Stages: queued → fetching → chunking → summarizing → done</li>
        </ul>
      </div>

      <div className="text-xs text-gray-500">
        <strong>Tip:</strong> Open DevTools Network tab to see the SSE connection.
      </div>
    </div>
  );
}
