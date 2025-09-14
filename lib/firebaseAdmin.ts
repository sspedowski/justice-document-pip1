// lib/firebaseAdmin.ts — lazy, single-instance Admin app (Node runtime only)

type AdminNS = typeof import("firebase-admin")

const globalForAdmin = globalThis as unknown as {
  __adminApp?: import("firebase-admin").app.App
}

function getAdmin(): AdminNS {
  // require at call-time (avoids Edge/SSR import-time issues)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("firebase-admin") as AdminNS
}

function initAdminApp() {
  if (globalForAdmin.__adminApp) return globalForAdmin.__adminApp
  const admin = getAdmin()

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    (process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).project_id
      : undefined)

  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    (projectId ? `https://${projectId}.firebaseio.com` : undefined)

  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      globalForAdmin.__adminApp = admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId: projectId || creds.project_id,
        databaseURL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      })
    } else {
      // local dev fallback (GOOGLE_APPLICATION_CREDENTIALS / metadata)
      globalForAdmin.__adminApp = admin.initializeApp({ projectId, databaseURL })
    }
  } else {
    globalForAdmin.__adminApp = admin.app()
  }
  return globalForAdmin.__adminApp
}

export function getDb() {
  return initAdminApp().firestore()
}

// Alternative export name for compatibility
export function db() {
  return getDb()
}

export function getRtdb() {
  return initAdminApp().database()
}

export function verifyIdToken(idToken: string) {
  const admin = getAdmin()
  return admin.auth().verifyIdToken(idToken)
}

export async function verifyAppCheck(token?: string): Promise<boolean> {
  if (!token) return false
  const admin = getAdmin()
  try {
    await admin.appCheck().verifyToken(token)
    return true
  } catch {
    return false
  }
}
