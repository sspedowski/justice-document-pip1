import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const files = ['pdfs/example1.pdf', 'pdfs/example2.pdf'];

for (const f of files) {
  const buf = readFileSync(f);
  const head = buf.subarray(0, 5).toString('ascii'); // "%PDF-"
  assert.equal(head, '%PDF-', `${f} does not start with %PDF-`);
  assert.ok(buf.length > 100, `${f} looks too small to be a valid PDF`);
}
