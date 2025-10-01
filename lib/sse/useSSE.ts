import { useEffect, useRef, useState } from 'react';

export interface SSEEvent {
  stage: string;
  progress?: number;
  summary?: string;
  tokensUsed?: number;
  message?: string;
  [k: string]: unknown;
}

interface Options<T extends SSEEvent> {
  url: string;
  onEvent?: (ev: T) => void;
  autoStart?: boolean;
  body?: Record<string, unknown>;
  method?: string;
}

export function useSSE<T extends SSEEvent = SSEEvent>(opts: Options<T>) {
  const { url, onEvent, autoStart = true, body, method = 'POST' } = opts;
  const [events, setEvents] = useState<T[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = () => {
    if (abortRef.current) return; // already running
    const controller = new AbortController();
    abortRef.current = controller;
    setIsActive(true);
    setError(null);

    fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }).then(async (res) => {
      if (!res.body) throw new Error('No body');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const parts = buffer.split(/\n\n/);
        buffer = parts.pop() || '';
        for (const p of parts) {
          if (!p.startsWith('data:')) continue;
          const json = p.replace(/^data:\s*/, '');
            try {
              const parsed: T = JSON.parse(json);
              setEvents((e) => [...e, parsed]);
              onEvent?.(parsed);
              if (parsed.stage === 'end' || parsed.stage === 'error') {
                controller.abort();
              }
            } catch (e) {
              // ignore parse errors for partial frames
            }
        }
      }
    }).catch((e) => {
      if (e.name !== 'AbortError') setError(e.message || 'SSE failed');
    }).finally(() => {
      abortRef.current = null;
      setIsActive(false);
    });
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { events, start, stop, isActive, error };
}
