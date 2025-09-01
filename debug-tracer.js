/* global window, console */

export function log(...args) {
  const out = args.map(a => (a && typeof a === 'object' ? JSON.stringify(a, null, 2) : a));
  if (typeof console !== 'undefined' && console.debug) console.debug(...out);
}

// Dev-only console.log shiv: replace native console.log to stringify objects to avoid [object Object]
if (typeof window !== 'undefined' && !window.__SAFE_LOG__) {
  window.__SAFE_LOG__ = true;
  const raw = console.log.bind(console);
  console.log = (...args) => {
    const out = args.map(a => (a && typeof a === 'object' ? JSON.stringify(a, null, 2) : a));
    raw(...out);
  };
}

export default { log };
