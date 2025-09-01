const util = require('util');
if (!global.__SAFE_LOG__) {
  global.__SAFE_LOG__ = true;
  const raw = console.log;
  console.log = (...args) => raw(...args.map(a => (typeof a === 'object' ? util.inspect(a, { depth: null, colors: false }) : a)));
}
