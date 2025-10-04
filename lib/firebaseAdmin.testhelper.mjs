// JS-only mirror of __testBuildOptions from lib/firebaseAdmin.ts for tests
export function __testBuildOptions() {
  const envProjectId = process.env.FIREBASE_PROJECT_ID
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET
  const hasCreds = !!process.env.FIREBASE_SERVICE_ACCOUNT
  let creds
  if (hasCreds) {
    try { creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) } catch { creds = undefined }
  }
  const effectiveProjectId = envProjectId || (creds && creds.project_id)
  const inferredDbUrl = process.env.FIREBASE_DATABASE_URL || (effectiveProjectId ? `https://${effectiveProjectId}.firebaseio.com` : undefined)
  const base = {}
  if (hasCreds) base.credential = 'present'
  if (effectiveProjectId) base.projectId = effectiveProjectId
  if (inferredDbUrl) base.databaseURL = inferredDbUrl
  if (storageBucket) base.storageBucket = storageBucket
  return base
}
