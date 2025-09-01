// debug-tracer.js
const isBrowser = typeof window !== 'undefined';
const isDev = typeof import.meta !== 'undefined' && import.meta?.env?.DEV;

export function log(...args) {
  const out = args.map(a =>
    a && typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
  );
  // keep as debug so lint allows it cleanly
  console.debug(...out);
}

// Dev-only: make ANY raw console.log(obj) pretty-print to avoid [object Object]
if (isBrowser && isDev && !window.__SAFE_LOG__) {
  window.__SAFE_LOG__ = true;
  const raw = console.log;
  console.log = (...args) => {
    const out = args.map(a =>
      a && typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    );
    raw(...out);
  };
}
