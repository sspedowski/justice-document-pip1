// Tiny PDF generator for sample files (no deps)
// Produces two small, valid single-page PDFs with simple text content.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function pad10(n) {
  const s = String(n);
  return s.length < 10 ? '0'.repeat(10 - s.length) + s : s;
}

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createSimplePdf(text) {
  const objects = [];
  const offsets = [0]; // index 0 is the free object
  let content = '%PDF-1.4\n';

  const addObject = (obj) => {
    offsets.push(content.length);
    content += obj;
  };

  // 1: Catalog
  addObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  // 2: Pages
  addObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  // 3: Page
  addObject('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
  // 4: Contents (stream)
  const txt = escapePdfText(text);
  const streamBody = `BT /F1 24 Tf 72 720 Td (${txt}) Tj ET`;
  addObject(`4 0 obj\n<< /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream\nendobj\n`);
  // 5: Font
  addObject('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  // xref
  const xrefStart = content.length;
  content += 'xref\n';
  content += '0 6\n';
  content += '0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    content += `${pad10(offsets[i])} 00000 n \n`;
  }
  // trailer
  content += 'trailer\n';
  content += '<< /Size 6 /Root 1 0 R >>\n';
  content += 'startxref\n';
  content += xrefStart + '\n';
  content += '%%EOF\n';

  return Buffer.from(content, 'utf8');
}

function writePdf(relPath, text) {
  const outPath = resolve(__dirname, '..', relPath);
  const buf = createSimplePdf(text);
  writeFileSync(outPath, buf);
}

writePdf('pdfs/example1.pdf', 'Medical — Jace — Withholding treatment');
writePdf('pdfs/example2.pdf', 'Legal — Josh — Due process violation');

console.log('Sample PDFs generated in pdfs/.');
