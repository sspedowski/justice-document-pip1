"use client";
import { useState } from 'react';
import { useSSE } from '@/lib/sse/useSSE';

type Stage = 'queued' | 'fetching' | 'chunking' | 'summarizing' | 'result' | 'end';
type Msg =
  | { stage: Exclude<Stage, 'result' | 'end'>; progress?: number }
  | { stage: 'result'; result: string }
  | { stage: 'end'; ok: true };

type ProgressMsg = { stage: 'queued' | 'fetching' | 'chunking' | 'summarizing'; progress: number };
type SummarizingMsg = { stage: 'summarizing'; progress: number };

function hasProgress(m: Msg): m is ProgressMsg {
  const candidate = m as Record<string, unknown>;
  return 'progress' in candidate && typeof candidate.progress === 'number';
}

function isSummarizingWithProgress(m: Msg): m is SummarizingMsg {
  return m.stage === 'summarizing' && hasProgress(m);
}

export default function SummarizeDemo() {
  const [text, setText] = useState('Paste text here to “summarize” (mock)…');
  const { messages, loading, start, cancel, canStart } = useSSE({ url: '/api/summarize/stream', body: { text } });
  const typed = messages as Msg[];
  const last = typed[typed.length - 1];
  const progress = (
    typed.find(isSummarizingWithProgress)?.progress ??
    typed.find(hasProgress)?.progress ??
    (last?.stage === 'end' ? 100 : 0)
  ) as number;
  const steps = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100];
  const nearest = steps.reduce((a,b)=> Math.abs(b-progress) < Math.abs(a-progress) ? b : a, 0);
  const widthClass = nearest===100? 'w-full' : nearest===0? 'w-0' : `w-[${nearest}%]`;

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
      {typed.find((m) => m.stage === 'result') && (
        <div className="border rounded-md p-3">
          <h2 className="font-medium mb-2">Result</h2>
          <p>{(typed.find((m) => m.stage === 'result') as Extract<Msg,{stage:'result'}>)?.result}</p>
        </div>
      )}
    </main>
  );
}
