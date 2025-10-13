/**
 * Minimal redaction to avoid accidentally leaking tokens in digests.
 * Extend as needed.
 */
export function redactSecrets(input: string): string {
  if (!input) return input;
  return input
    // Obvious token/webhook shapes
    .replace(/xox[baprs]-[A-Za-z0-9-]+/g, 'xox-REDACTED')
    .replace(/https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9\/]+/g, 'https://hooks.slack.com/services/REDACTED')
    // Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, 'Bearer REDACTED');
}
