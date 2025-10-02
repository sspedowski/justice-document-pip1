// lib/firebaseAdmin.ts — lazy, single-instance Admin app (Node runtime only)

import type { AppOptions } from 'firebase-admin/app'

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

  const envProjectId = process.env.FIREBASE_PROJECT_ID
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET

  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      const effectiveProjectId = envProjectId || creds.project_id
      const inferredDbUrl = process.env.FIREBASE_DATABASE_URL || (effectiveProjectId ? `https://${effectiveProjectId}.firebaseio.com` : undefined)

      const opts: AppOptions = {
        credential: admin.credential.cert(creds),
        ...(effectiveProjectId ? { projectId: effectiveProjectId } : {}),
        ...(inferredDbUrl ? { databaseURL: inferredDbUrl } : {}),
        ...(storageBucket ? { storageBucket } : {})
      }
      globalForAdmin.__adminApp = admin.initializeApp(opts)
    } else {
      // local dev fallback (GOOGLE_APPLICATION_CREDENTIALS / metadata)
      const inferredDbUrl = process.env.FIREBASE_DATABASE_URL || (envProjectId ? `https://${envProjectId}.firebaseio.com` : undefined)
      const opts: AppOptions = {
        ...(envProjectId ? { projectId: envProjectId } : {}),
        ...(inferredDbUrl ? { databaseURL: inferredDbUrl } : {})
      }
      globalForAdmin.__adminApp = admin.initializeApp(opts)
    }
  } else {
    globalForAdmin.__adminApp = admin.app()
  }
  return globalForAdmin.__adminApp
}

export function getDb() {
  return initAdminApp().firestore()
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
