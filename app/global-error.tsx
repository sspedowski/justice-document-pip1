/* global-error.tsx: fallback for uncaught exceptions */
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Global Error:', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6">
        <main className="max-w-lg text-center space-y-4">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="opacity-80 break-words">
            {error.message || 'An unexpected error occurred.'}
          </p>
          {error.digest && (
            <p className="text-xs opacity-60">Ref: {error.digest}</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="rounded-xl px-4 py-2 border"
            >
              Try again
            </button>
            <a href="/" className="rounded-xl px-4 py-2 border">
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
