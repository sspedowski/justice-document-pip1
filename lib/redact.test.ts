import { describe, it, expect } from 'vitest';
import { redact } from './redact.ts';

describe('redact', () => {
  it('redacts emails and counts them', () => {
    const input = 'Contact john.doe@example.com or jane+test@sub.domain.org now';
    const { redacted, summary } = redact(input);
    expect(redacted).not.toContain('john.doe@example.com');
    expect(redacted).not.toContain('jane+test@sub.domain.org');
    expect(summary.emails).toBe(2);
  });

  it('redacts phone numbers', () => {
    const input = 'Call me at 415-555-1234 or (212) 555 9876.';
    const { redacted, summary } = redact(input);
    expect(redacted).not.toContain('415-555-1234');
    expect(redacted).not.toContain('212) 555 9876');
    expect(summary.phones).toBe(2);
  });

  it('redacts SSNs', () => {
    const input = 'SSNs like 123-45-6789 or 987654321 must be removed';
    const { redacted, summary } = redact(input);
    expect(redacted).not.toContain('123-45-6789');
    expect(redacted).not.toContain('987654321');
    expect(summary.ssn).toBe(2);
  });

  it('redacts addresses', () => {
    const input = 'Ship to 123 Main Street Springfield 94105 and 42 Broadway Ave 10001';
    const { redacted, summary } = redact(input);
    expect(summary.addrs).toBeGreaterThanOrEqual(1);
    expect(redacted).not.toContain('123 Main Street');
  });
});
