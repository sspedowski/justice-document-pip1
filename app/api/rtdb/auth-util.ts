// Small helper to keep auth logic testable without firebase-admin
import type { NextRequest } from "next/server";

type HeaderGetter = { headers: { get: (key: string) => string | null } };

// Case-insensitive extractor for Firebase App Check header
export function extractAppCheckToken(req: Pick<HeaderGetter, "headers"> | NextRequest): string | undefined {
  const get = (k: string) => (req as HeaderGetter).headers.get(k);
  return (
    get("x-firebase-appcheck") ||
    get("X-Firebase-AppCheck") ||
    undefined
  ) ?? undefined;
}
