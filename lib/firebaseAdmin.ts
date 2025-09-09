import admin from 'firebase-admin';

if (!admin.apps.length) {
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT missing');
  let svc;
  try {
    svc = JSON.parse(saRaw);
  } catch (e) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
  }
  admin.initializeApp({
    credential: admin.credential.cert(svc),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const adminApp = admin.app();
export const db = admin.firestore();
export const bucket = admin.storage().bucket();

export async function verifyIdToken(idToken?: string) {
  if (!idToken) throw new Error('Missing auth token');
  return admin.auth().verifyIdToken(idToken);
}

export async function verifyAppCheck(appCheckToken?: string) {
  if (!appCheckToken) throw new Error('Missing App Check token');
  try {
    // @ts-ignore optional depending on admin SDK version
    await admin.appCheck().verifyToken(appCheckToken);
    return true;
  } catch {
    throw new Error('Invalid App Check token');
  }
}
