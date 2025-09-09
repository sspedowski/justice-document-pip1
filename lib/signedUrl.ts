import { bucket } from './firebaseAdmin';

export async function getSignedUrl(storagePath: string, minutes = 60) {
  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + minutes * 60 * 1000,
  });
  return url;
}

