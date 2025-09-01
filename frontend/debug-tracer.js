// debug-tracer.js
export function log(...args) {
  const out = args.map(a =>
    a && typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
  );
  // use debug so it’s easy to filter
  console.debug(...out);
}

// Dev-only log shiv: prevents [object Object] from any stray console.log(obj)
if (typeof window !== 'undefined' && !window.__SAFE_LOG__) {
  window.__SAFE_LOG__ = true;
  const raw = console.log;
  console.log = (...args) => {
    const out = args.map(a =>
      a && typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    );
    raw(...out);
  };
}
