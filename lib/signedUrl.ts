import { bucket } from './firebaseAdmin';

export async function getSignedUrl(path: string, ttlSeconds = 3600) {
  const [url] = await bucket.file(path).getSignedUrl({
    action: 'read',
    expires: Date.now() + ttlSeconds * 1000,
  });
  return url;
}
