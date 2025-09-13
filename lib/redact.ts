// Simple PII redaction utility
// NOTE: These regexes are intentionally conservative and can be extended.

export interface RedactionSummary {
  emails: number;
  phones: number;
  ssn: number;
  addrs: number;
}

export interface RedactionResult {
  redacted: string;
  summary: RedactionSummary;
}

const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// US phone (various formats) 10 digits optionally with country code
const phoneRe = /(?:(?:\+?1[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]?\d{3}[ .-]?\d{4})/g;
// US SSN patterns (XXX-XX-XXXX or XXXXXXXXX)
const ssnRe = /\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b/g;
// Simplistic address line: number + word tokens + (Street|St|Ave|Avenue|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr) + optional ZIP
const addrRe = /\b\d{1,5}\s+[A-Za-z0-9.,'\- ]+\s(?:Street|St|Ave|Avenue|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b(?:[^\n]{0,40}?\b\d{5}(?:-\d{4})?\b)?/g;

export function redact(input: string): RedactionResult {
  let emails = 0, phones = 0, ssn = 0, addrs = 0;
  let working = input;

  working = working.replace(emailRe, () => { emails++; return '[REDACTED_EMAIL]'; });
  working = working.replace(phoneRe, (_m) => {
    // Avoid double-counting numeric sequences that might be SSNs; leave order: phone before ssn is fine
    phones++; return '[REDACTED_PHONE]';
  });
  working = working.replace(ssnRe, () => { ssn++; return '[REDACTED_SSN]'; });
  working = working.replace(addrRe, () => { addrs++; return '[REDACTED_ADDRESS]'; });

  return { redacted: working, summary: { emails, phones, ssn, addrs } };
}
