export const api = (p = '') => `/api${p ? (p.startsWith('/') ? p : `/${p}`) : ''}`;
