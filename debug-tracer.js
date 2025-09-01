export function log(...args) {
  const msg = args
    .map((a) => (a && typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
    .join(' ');
  console.debug(msg);
}

export default { log };
