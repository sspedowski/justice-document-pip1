'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SSEFrame } from '@/lib/types/summarize';
import { isSSEFrame } from '@/lib/types/guards';

export interface UseSSEOptions<T extends SSEFrame = SSEFrame> {
  url: string;
  body: Record<string, unknown> | null;
  auto?: boolean;
  onMessage?: (frame: T) => void;
  onError?: (err: Event) => void;
}

export interface UseSSEReturn<T extends SSEFrame = SSEFrame> {
  messages: T[];
  loading: boolean;
  start: () => Promise<void>;
  cancel: () => void;
  canStart: boolean;
}

export function useSSE<T extends SSEFrame = SSEFrame>(
  opts: UseSSEOptions<T>
): UseSSEReturn<T> {
  const { url, body, auto = false, onMessage, onError } = opts;
  const [messages, setMessages] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const canStart = useMemo(() => !!url && body !== null && !loading, [url, body, loading]);

  const start = async () => {
    if (!canStart) return;
    setMessages([]);
    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Bad response: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const line = chunk.split('\n').find(l => l.startsWith('data: '));
          if (!line) continue;
          try {
            const raw = JSON.parse(line.slice(6));
            if (!isSSEFrame(raw)) {
              console.warn('Invalid SSE frame shape:', raw);
              continue;
            }
            const frame = raw as T;
            setMessages(m => [...m, frame]);
            onMessage?.(frame);
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      if (onError && err instanceof Event) {
        onError(err);
      }
      // swallow for now; could push an error frame variant
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setLoading(false);
  };

  useEffect(() => {
    if (auto && canStart) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, canStart, url, JSON.stringify(body)]);

  return { messages, loading, start, cancel, canStart };
}
