import React, { useState, useRef, useCallback } from 'react';
import { summarizeStream, StreamEvent } from '../hooks/useSummarizeStream';

export const SummarizeCard: React.FC = () => {
  const [text, setText] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'error' | 'done'>('idle');
  const [tokens, setTokens] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const onEvent = useCallback((evt: StreamEvent) => {
    if (controllerRef.current.cancelled) return;
    if (evt.type === 'delta') {
      setOutput(prev => prev + evt.text + ' ');
    } else if (evt.type === 'complete') {
      setTokens(evt.tokensUsed);
      setStatus('done');
    } else if (evt.type === 'error') {
      setError(evt.error);
      setStatus('error');
    }
  }, []);

  const run = async () => {
    setOutput('');
    setError(null);
    setTokens(null);
    setStatus('running');
    controllerRef.current.cancelled = false;
    try {
      await summarizeStream(text, {}, onEvent);
    } catch (e: any) {
      setError(e.message || 'Failed');
      setStatus('error');
    }
  };

  const cancel = () => {
    controllerRef.current.cancelled = true;
    setStatus('idle');
  };

  return (
    <div className="border rounded p-4 space-y-3 bg-white shadow-sm">
      <h2 className="text-lg font-semibold">AI Summarize (Streaming)</h2>
      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={5}
        placeholder="Paste text to summarize"
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={status === 'running'}
      />
      <div className="flex gap-2">
        <button
          onClick={run}
          disabled={!text.trim() || status === 'running'}
          className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-40"
        >{status === 'running' ? 'Summarizing…' : 'Summarize'}</button>
        {status === 'running' && (
          <button onClick={cancel} className="px-3 py-1 rounded bg-gray-200 text-sm">Cancel</button>
        )}
      </div>
      <div className="min-h-[4rem] whitespace-pre-wrap text-sm border rounded p-2 bg-gray-50">
        {output || (status === 'running' ? '…' : 'Output will appear here')}
      </div>
      <div className="text-xs text-gray-500 flex flex-wrap gap-4">
        <span>Status: {status}</span>
        {tokens !== null && <span>Tokens: {tokens}</span>}
        {error && <span className="text-red-600">Error: {error}</span>}
      </div>
    </div>
  );
};
