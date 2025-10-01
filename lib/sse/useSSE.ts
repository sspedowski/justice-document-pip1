'use client';
import { useEffect, useRef, useState } from 'react';

export function useSSE(url: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;
    const es = new EventSource(url);
    esRef.current = es;
    es.onmessage = (e) => setMessages((m) => [...m, JSON.parse(e.data)]);
    es.onerror = () => { es.close(); };
    return () => es.close();
  }, [url]);

  return { messages };
}
