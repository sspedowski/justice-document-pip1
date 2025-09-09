import pdfParse from 'pdf-parse';
import { bucket } from './firebaseAdmin';

export async function extractPdfTextToStorage(storagePath: string) {
  if (process.env.EXTRACT_PDF_TEXT !== 'true') return null;
  const [buf] = await bucket.file(storagePath).download();
  const { text } = await pdfParse(buf);
  const txtPath = storagePath.replace(/\.pdf$/i, '.txt');
  await bucket.file(txtPath).save(text, { contentType: 'text/plain' });
  return { txtPath, chars: text.length };
}
