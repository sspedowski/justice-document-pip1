"use client";
import { useState } from 'react';
import { useSSE } from '@/lib/sse/useSSE';
import { type SSEFrame, type ProgressFrame, type ResultFrame } from '@/lib/types/summarize';

export default function SummarizeDemo() {
  const [text, setText] = useState('Paste text here to "summarize" (mock)…');
  const { messages, loading, start, cancel, canStart } = useSSE<SSEFrame>({ url: '/api/summarize/stream', body: { text } });
  const last = messages[messages.length - 1];

  const progressFrame = messages.find((m): m is ProgressFrame => m.stage === 'progress' && typeof (m as ProgressFrame).pct === 'number') as ProgressFrame | undefined;
  const progress = progressFrame?.pct ?? (last?.stage === 'end' ? 100 : 0);

  const steps = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
  const nearest = steps.reduce((a,b)=> Math.abs(b-progress) < Math.abs(a-progress) ? b : a, 0);
  const widthClass = nearest===100? 'w-full' : nearest===0? 'w-0' : `w-[${nearest}%]`;

  const resultFrame = messages.find((m): m is ResultFrame => m.stage === 'result') as ResultFrame | undefined;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Streaming Summarize (SSE) Demo</h1>
      <label htmlFor="sse-text" className="block text-xs font-medium text-gray-600">Input text</label>
      <textarea
        id="sse-text"
        className="w-full min-h-[160px] p-3 border rounded-md outline-none"
        value={text}
        placeholder="Enter text to stream a mock summary"
        aria-label="Text to summarize"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50" onClick={start} disabled={!canStart}>
          {loading ? 'Streaming…' : 'Stream'}
        </button>
        <button className="px-4 py-2 rounded-md border" onClick={cancel} disabled={!loading}>Cancel</button>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded" aria-hidden="true">
        <div className={`h-2 bg-blue-500 rounded transition-all ${widthClass}`} />
      </div>
      <div className="text-sm text-gray-600">Last stage: <code>{last?.stage || '—'}</code></div>
      <details className="border rounded-md p-3">
        <summary className="cursor-pointer font-medium">Raw events ({messages.length})</summary>
        <pre className="mt-3 text-sm overflow-auto">{JSON.stringify(messages, null, 2)}</pre>
      </details>
      {resultFrame && (
        <div className="border rounded-md p-3">
          <h2 className="font-medium mb-2">Result</h2>
          <p>{resultFrame.partial}</p>
        </div>
      )}
    </main>
  );
}
