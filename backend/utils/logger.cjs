// backend/utils/logger.cjs
const isDev = process.env.NODE_ENV !== 'production';
const LEVEL = (process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')).toLowerCase();
const rank = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = rank[LEVEL] ?? 2;
function emit(fn, level, args) {
  const ts = new Date().toISOString();
  fn(`[${ts}] [${level.toUpperCase()}]`, ...args);
}
module.exports.logger = {
  error: (...a) => rank.error <= threshold && emit(console.error, 'error', a),
  warn:  (...a) => rank.warn  <= threshold && emit(console.warn,  'warn',  a),
  info:  (...a) => rank.info  <= threshold && emit(console.info,  'info',  a),
  debug: (...a) => rank.debug <= threshold && emit(console.debug, 'debug', a),
};
