const LOCAL_STORAGE_KEY = 'justiceDashboard.vercelToolbarEnabled';

function normalizeBool(value) {
  if (typeof value !== 'string') return undefined;
  const lowered = value.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(lowered)) return true;
  if (['0', 'false', 'no', 'off'].includes(lowered)) return false;
  return undefined;
}

function readEnvString(env, key) {
  if (!env || typeof env !== 'object') return undefined;
  const value = env[key];
  return typeof value === 'string' ? value : undefined;
}

function readWindowEnv(win, key) {
  if (!win || typeof win !== 'object') return undefined;
  const value = win[key] ?? win[`NEXT_PUBLIC_${key}`];
  return typeof value === 'string' ? value : undefined;
}

function readLocalStorage(win, key) {
  if (!win || typeof win !== 'object' || !win.localStorage) return undefined;
  try {
    return win.localStorage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

export function staffToolbarEnabled({ env, win } = {}) {
  const override = readLocalStorage(win, LOCAL_STORAGE_KEY);
  const overrideBool = normalizeBool(override);
  if (typeof overrideBool === 'boolean') return overrideBool;

  const envValue =
    readEnvString(env, 'VITE_VERCEL_TOOLBAR_ENABLED') ??
    readEnvString(env, 'NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED') ??
    readWindowEnv(win, 'VITE_VERCEL_TOOLBAR_ENABLED') ??
    readWindowEnv(win, 'NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED');

  const envBool = normalizeBool(envValue);
  return typeof envBool === 'boolean' ? envBool : false;
}

export function getToolbarDomainPattern({ env, win } = {}) {
  return (
    readEnvString(env, 'VITE_VERCEL_TOOLBAR_DOMAIN_REGEX') ??
    readEnvString(env, 'NEXT_PUBLIC_VERCEL_TOOLBAR_DOMAIN_REGEX') ??
    readWindowEnv(win, 'VITE_VERCEL_TOOLBAR_DOMAIN_REGEX') ??
    readWindowEnv(win, 'NEXT_PUBLIC_VERCEL_TOOLBAR_DOMAIN_REGEX') ??
    undefined
  );
}
