import { getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// App Check optional – import dynamically to avoid breaking if not configured.

interface SummarizeInput { text: string; docId?: string }
interface SummarizeOutput { outputText: string; tokensUsed: number | null; model: string }

export async function summarize({ text, docId }: SummarizeInput): Promise<SummarizeOutput> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };

  // Obtain Firebase ID token if firebase app initialized
  try {
    if (getApps().length) {
      const auth = getAuth();
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        headers['authorization'] = `Bearer ${idToken}`;
      }
      // Try App Check
      try {
        const { getToken } = await import('firebase/app-check');
        // @ts-expect-error - getToken may not have proper types in all versions
        const appCheckTokenResult = await getToken();
        if (appCheckTokenResult?.token) {
          headers['x-firebase-appcheck'] = appCheckTokenResult.token;
        }
      } catch {
        // ignore if App Check not set up
      }
    }
  } catch {
    // ignore auth errors; endpoint will enforce in prod
  }

  const res = await fetch('/api/ai/summarize', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, docId })
  });

  if (!res.ok) {
    throw new Error(`Summarize failed: ${res.status}`);
  }
  return res.json();
}
