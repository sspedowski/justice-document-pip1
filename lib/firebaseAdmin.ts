import admin from 'firebase-admin';

let _app: admin.app.App | null = null;

function init() {
  if (_app) return _app;
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        _app = admin.initializeApp({
          credential: admin.credential.cert(creds as admin.ServiceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT', e);
        throw e;
      }
    } else {
      _app = admin.initializeApp();
    }
  } else {
    _app = admin.app();
  }
  return _app;
}

export const adminApp = init();
export const db = admin.firestore();
export const bucket = admin.storage().bucket();

export function verifyIdToken(idToken: string) {
  return admin.auth().verifyIdToken(idToken);
}

export async function verifyAppCheck(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    // App Check API is optional unless in production
    // @ts-ignore - appCheck may be undefined in older firebase-admin versions
    await admin.appCheck().verifyToken(token);
    return true;
  } catch {
    return false;
  }
}
