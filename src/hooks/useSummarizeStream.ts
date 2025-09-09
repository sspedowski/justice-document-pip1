import { getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export interface StreamEventStart { type: 'start'; ts: number }
export interface StreamEventDelta { type: 'delta'; text: string }
export interface StreamEventComplete { type: 'complete'; tokensUsed: number | null }
export interface StreamEventError { type: 'error'; error: string }
export type StreamEvent = StreamEventStart | StreamEventDelta | StreamEventComplete | StreamEventError;

export interface UseSummarizeStreamOptions { docId?: string }

export async function summarizeStream(text: string, opts: UseSummarizeStreamOptions = {}, onEvent?: (e: StreamEvent) => void): Promise<string> {
  const headers: Record<string,string> = { 'content-type': 'application/json' };
  try {
    if (getApps().length) {
      const auth = getAuth();
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        headers['authorization'] = `Bearer ${idToken}`;
      }
      try {
        const { getToken } = await import('firebase/app-check');
        // @ts-ignore
        const appCheckTokenResult = await getToken();
        if (appCheckTokenResult?.token) headers['x-firebase-appcheck'] = appCheckTokenResult.token;
      } catch {}
    }
  } catch {}

  const res = await fetch('/api/ai/summarize/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, docId: opts.docId })
  });
  if (!res.ok || !res.body) throw new Error(`Stream request failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let leftover = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    leftover += chunk;
    let idx;
    while ((idx = leftover.indexOf('\n')) !== -1) {
      const line = leftover.slice(0, idx).trim();
      leftover = leftover.slice(idx + 1);
      if (!line) continue;
      try {
        const evt = JSON.parse(line) as StreamEvent;
        if (evt.type === 'delta') full += evt.text + ' ';
        onEvent?.(evt);
      } catch {
        // ignore malformed line
      }
    }
  }
  return full.trim();
}
