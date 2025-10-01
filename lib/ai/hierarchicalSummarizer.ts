import { redactSecrets } from './redact';

export type Chunk = { text: string };

export async function summarizeChunks(chunks: Chunk[]): Promise<{ title: string; body: string }> {
  // Minimal implementation: coalesce & trim (you can wire a real model later)
  const combined = chunks.map((c) => c.text).join('\n').trim();
  const redacted = redactSecrets(combined);
  const title = 'Daily Digest (Auto)';
  const body = redacted.length ? redacted : '*No content*';
  return { title, body };
}
