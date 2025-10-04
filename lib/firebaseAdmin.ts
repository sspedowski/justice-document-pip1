// lib/firebaseAdmin.ts — lazy, single-instance Admin app (Node runtime only)

import type { AppOptions } from 'firebase-admin/app'
import { createRequire } from 'module'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type AdminNS = typeof import("firebase-admin")

const globalForAdmin = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  __adminApp?: import("firebase-admin").app.App
}

const requireFn = createRequire(import.meta.url)

function getAdmin(): AdminNS {
  // load at call-time (avoids Edge/SSR import-time issues)
  return requireFn('firebase-admin') as AdminNS
}

function initAdminApp() {
  if (globalForAdmin.__adminApp) return globalForAdmin.__adminApp
  const admin = getAdmin()

  const envProjectId = process.env.FIREBASE_PROJECT_ID
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET

  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as unknown as import('firebase-admin/app').ServiceAccount & { project_id?: string }
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

// Test helper: build the AppOptions object the module would use without
// actually initializing firebase-admin (so unit tests avoid real SDK init).
// Not for production use.
export function __testBuildOptions() {
  const envProjectId = process.env.FIREBASE_PROJECT_ID
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET
  const hasCreds = !!process.env.FIREBASE_SERVICE_ACCOUNT
  let creds: { project_id?: string } | undefined
  if (hasCreds) {
    try { creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string) } catch { creds = undefined }
  }
  const effectiveProjectId = envProjectId || creds?.project_id
  const inferredDbUrl = process.env.FIREBASE_DATABASE_URL || (effectiveProjectId ? `https://${effectiveProjectId}.firebaseio.com` : undefined)
  const base: Record<string, unknown> = {}
  if (hasCreds) base.credential = 'present'
  if (effectiveProjectId) base.projectId = effectiveProjectId
  if (inferredDbUrl) base.databaseURL = inferredDbUrl
  if (storageBucket) base.storageBucket = storageBucket
  return base
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
